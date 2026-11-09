
from datetime import date, datetime

from flask import Blueprint, jsonify, request
from services.demo_user import get_demo_user
from services.sample_data import load_sample_events

events_bp = Blueprint("events", __name__)

# Temporary event data until the database is connected.
EVENTS = [
    {
        "id": 1,
        "club_id": 1,
        "title": "Computer Science Workshop",
        "date": "2026-11-05",
        "location": "CCNY Campus",
        "description": "Learn programming skills with other students."
    },
    {
        "id": 2,
        "club_id": 2,
        "title": "Robotics Competition",
        "date": "2026-11-12",
        "location": "CCNY Campus",
        "description": "Join a robotics competition."
    },
    {
        "id": 3,
        "club_id": 3,
        "title": "Photography Walk",
        "date": "2026-11-20",
        "location": "CCNY Campus",
        "description": "Explore photography with club members."
    }
]



# Issues #15 and #17: Return upcoming events,
# optionally filtered by club ID.
@events_bp.get("/api/events")
def get_events():
    events = load_sample_events()

    club_id = request.args.get("club_id", type=int)

    if club_id is not None:
        events = [
            event for event in events
            if event["club_id"] == club_id
        ]

    events = sorted(
        events,
        key=lambda event: (
            datetime.fromisoformat(
                event["start_time"].replace("Z", "+00:00")
            ),
            event["id"]
        )
    )

    return jsonify(events)



@events_bp.get("/api/events/personalized")
def get_personalized_events():
    user = get_demo_user()
    followed_clubs = user["followed_clubs"]

    today = date.today().isoformat()

    personalized_events = [
        event for event in EVENTS
        if event["club_id"] in followed_clubs
        and event["date"] >= today
    ]

    return jsonify(personalized_events), 200


# Issue #16: Return a specific event by its ID.
@events_bp.get("/api/events/<int:event_id>")
def get_event_details(event_id):
    events = load_sample_events()

    for event in events:
        if event["id"] == event_id:
            return jsonify(event), 200

    return jsonify({"error": "Event not found"}), 404