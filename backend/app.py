import os

from flask import Flask, jsonify
from flask_cors import CORS

from api.clubs import clubs_bp
from api.events import events_bp


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