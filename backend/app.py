
from flask import Flask, jsonify
from flask_cors import CORS 
from api.clubs import clubs_bp
from api.events import events_bp


def create_app():
    app = Flask(__name__)
    CORS(app)

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
    app.run(debug=True, port=5000)
