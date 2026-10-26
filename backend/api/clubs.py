
from flask import Blueprint, jsonify

clubs_bp = Blueprint("clubs", __name__)

# Temporary club data until the database is connected.
CLUBS = [
    {
        "id": 1,
        "name": "Computer Science Club",
        "description": "A club for students interested in computer science."
    },
    {
        "id": 2,
        "name": "Robotics Club",
        "description": "A club for students interested in robotics."
    },
    {
        "id": 3,
        "name": "Photography Club",
        "description": "A club for students interested in photography."
    }
]


@clubs_bp.get("/api/clubs")
def get_clubs():
    return jsonify(CLUBS)
