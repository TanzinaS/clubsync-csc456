
from services.sample_data import get_club, load_sample_clubs
from flask import Blueprint, jsonify
from services.demo_user import unfollow_club
from services.demo_user import follow_club

clubs_bp = Blueprint("clubs", __name__)




@clubs_bp.get("/api/clubs")
def get_clubs():
    return jsonify(load_sample_clubs())

@clubs_bp.post("/api/clubs/<int:club_id>/follow")
def follow_club_route(club_id):
    club = get_club(club_id)

    if club is None:
        return jsonify({"error": "Club not found"}), 404

    user = follow_club(club_id)
    return jsonify(user), 200


@clubs_bp.post("/api/clubs/<int:club_id>/unfollow")
def unfollow_club_route(club_id):
    club = get_club(club_id)

    if club is None:
        return jsonify({"error": "Club not found"}), 404

    user = unfollow_club(club_id)
    return jsonify(user), 200
