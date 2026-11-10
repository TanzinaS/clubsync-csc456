import os

from flask import Flask, jsonify
from flask_cors import CORS

from api.clubs import clubs_bp
from api.events import events_bp
from api.users import users_bp
from services.sample_data import DataUnavailableError


def create_app():
    app = Flask(__name__)

    # Issue #85: Allow configured frontend origins.
    # Support both localhost addresses during local development.
    default_origins = "http://127.0.0.1:5173,http://localhost:5173"

    frontend_origins = [
        origin.strip().rstrip("/")
        for origin in os.getenv("FRONTEND_ORIGIN", default_origins).split(",")
        if origin.strip()
    ]

    CORS(app, origins=frontend_origins)

    app.register_blueprint(clubs_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(users_bp)

    @app.get("/")
    def home():
        return jsonify({
            "message": "Welcome to ClubSync API",
            "status": "running"
        })

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "service": "ClubSync Backend"
        })

    # Issue #83: Return JSON for unknown routes (404).
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404

    # Issue #83: Return JSON for unsupported methods (405).
    @app.errorhandler(405)
    def method_not_allowed(error):
        return (
            jsonify({"error": "Method not allowed"}), 
            405,
            {"Allow": ", ".join(error.valid_methods or[])},
        )

    # Issue #83: Return JSON when shared data is unavailable.
    @app.errorhandler(DataUnavailableError)
    def data_unavailable(error):
        return jsonify({"error": "Data unavailable"}), 500

    # Issue #83: Return JSON for other server errors (500).
    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    # Issue #85: Debug mode is off unless explicitly enabled.
    debug_mode = os.getenv(
        "FLASK_DEBUG", "false"
    ).lower() in ("1", "true", "yes", "on")

    # Keep port 5001 for local development.
    app.run(
        debug=debug_mode,
        port=5001
    )