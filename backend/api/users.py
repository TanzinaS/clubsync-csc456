from flask import Blueprint, jsonify
from services.demo_user import get_demo_user

users_bp = Blueprint("users", __name__)


@users_bp.route("/api/me", methods=["GET"])
def get_current_user():
    user = get_demo_user()
    return jsonify({
        "id": user["id"],
        "name": user["name"],
        "followed_clubs": user["followed_clubs"]
    }), 200