
from flask import Blueprint, jsonify
from services.demo_user import unfollow_club

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

@clubs_bp.post("/api/clubs/<int:club_id>/unfollow")
def unfollow_club_route(club_id):
    club = next((c for c in CLUBS if c["id"] == club_id), None)

    if club is None:
        return jsonify({"error": "Club not found"}), 404

    user = unfollow_club(club_id)
    return jsonify(user), 200
