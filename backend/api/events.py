
from datetime import date

from flask import Blueprint, jsonify
from services.demo_user import get_demo_user

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


@events_bp.get("/api/events")
def get_events():
    today = date.today().isoformat()
    upcoming_events = [
        event for event in EVENTS if event["date"] >= today
    ]
    return jsonify(upcoming_events)

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