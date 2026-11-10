


from flask import Blueprint, jsonify, request
from services.demo_user import get_demo_user
from services.sample_data import load_sample_events, sorted_events

events_bp = Blueprint("events", __name__)





# Issues #15 and #17: Return upcoming events,
# optionally filtered by club ID.
@events_bp.get("/api/events")
def get_events():
    events = load_sample_events()

    club_id = request.args.get("club_id")

    if club_id is not None:
        try:
            club_id = int(club_id)
        except ValueError:
            return jsonify({"error": "Invalid club_id"}), 400

        events = [
            event for event in events
            if event["club_id"] == club_id
        ]

    events = sorted_events(events)
    return jsonify(events)


@events_bp.get("/api/events/personalized")
def get_personalized_events():
    user = get_demo_user()
    followed_clubs = user["followed_clubs"]

    events = load_sample_events()

    personalized_events = [
        event for event in events
        if event["club_id"] in followed_clubs
    ]

    personalized_events = sorted_events(personalized_events)

    return jsonify(personalized_events), 200


# Issue #16: Return a specific event by its ID.
@events_bp.get("/api/events/<int:event_id>")
def get_event_details(event_id):
    events = load_sample_events()

    for event in events:
        if event["id"] == event_id:
            return jsonify(event), 200

    return jsonify({"error": "Event not found"}), 404