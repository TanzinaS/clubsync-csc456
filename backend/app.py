
import logging
import sys
import time

from flask import Flask, jsonify, g, request
from flask_cors import CORS

from api.clubs import clubs_bp
from api.events import events_bp
from api.users import users_bp
from services.sample_data import DataUnavailableError


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Issue #84: Send application logs to standard output.
    logger = logging.getLogger("clubsync.backend")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s %(message)s"
            )
        )
        logger.addHandler(handler)

    logger.propagate = False

    app.register_blueprint(clubs_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(users_bp)

    # Issue #84: Start timing each request.
    @app.before_request
    def start_request_timer():
        g.request_start_time = time.perf_counter()

    # Issue #84: Log method, path, status, and duration.
    @app.after_request
    def log_request(response):
        start_time = g.get("request_start_time")

        if start_time is not None:
            duration_ms = (
                time.perf_counter() - start_time
            ) * 1000
        else:
            duration_ms = 0.0

        logger.info(
            "%s %s status=%s duration_ms=%.2f",
            request.method,
            request.path,
            response.status_code,
            duration_ms
        )

        return response

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

    # Issue #83: Preserve the Allow header for HTTP 405.
    @app.errorhandler(405)
    def method_not_allowed(error):
        return (
            jsonify({"error": "Method not allowed"}),
            405,
            {"Allow": ", ".join(error.valid_methods or [])},
        )

    # Issues #83 and #84:
    # Log shared-data errors without exposing details.
    @app.errorhandler(DataUnavailableError)
    def data_unavailable(error):
        logger.error(
            "Shared data unavailable: %s",
            request.path,
            exc_info=(
                type(error),
                error,
                error.__traceback__
            )
        )

        return jsonify({
            "error": "Data unavailable"
        }), 500

    # Issues #83 and #84:
    # Flask already logs unhandled exceptions.
    # Avoid logging the same stack trace twice.
    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            "error": "Internal server error"
        }), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5001)
