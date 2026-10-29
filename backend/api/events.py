
from datetime import date, datetime, time, timedelta
import json
from pathlib import Path
from zoneinfo import ZoneInfo

from flask import Blueprint, jsonify, Response
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


def escape_ics(value):
    return (
        str(value)
        .replace("\\", "\\\\")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
    )



@events_bp.get("/api/events/<int:event_id>/calendar")
def export_event_calendar(event_id):
    data_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "sample_events.json"
    )

    try:
        with data_path.open("r", encoding="utf-8") as file:
            events = json.load(file)
    except (OSError, json.JSONDecodeError):
        return jsonify({"error": "Event data unavailable"}), 500

    event = next(
        (item for item in events if item["id"] == event_id),
        None
    )

    if event is None:
        return jsonify({"error": "Event not found"}), 404

    start = datetime.fromisoformat(event["start_time"])
    end = datetime.fromisoformat(event["end_time"])

    start_utc = start.astimezone(ZoneInfo("UTC"))
    end_utc = end.astimezone(ZoneInfo("UTC"))

    ics_content = "\r\n".join([
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ClubSync//Calendar Export//EN",
        "BEGIN:VEVENT",
        f"UID:clubsync-event-{event_id}@clubsync.local",
        f"DTSTAMP:{datetime.now(ZoneInfo('UTC')).strftime('%Y%m%dT%H%M%SZ')}",
        f"DTSTART:{start_utc.strftime('%Y%m%dT%H%M%SZ')}",
        f"DTEND:{end_utc.strftime('%Y%m%dT%H%M%SZ')}",
        f"SUMMARY:{escape_ics(event['title'])}",
        f"DESCRIPTION:{escape_ics(event['description'])}",
        f"LOCATION:{escape_ics(event['location'])}",
        "END:VEVENT",
        "END:VCALENDAR",
        ""
    ])

    return Response(
        ics_content,
        mimetype="text/calendar",
        headers={
            "Content-Disposition":
                f'attachment; filename="event_{event_id}.ics"'
        }
    )

def export_event_calendar(event_id):
    event = next(
        (event for event in EVENTS if event["id"] == event_id),
        None
    )

    if event is None:
        return jsonify({"error": "Event not found"}), 404

    event_date = date.fromisoformat(event["date"])
    timezone = ZoneInfo("America/New_York")

    # Temporary times until real event times are connected.
    start = datetime.combine(
        event_date, time(12, 0), tzinfo=timezone
    )
    end = start + timedelta(hours=1)

    start_utc = start.astimezone(ZoneInfo("UTC"))
    end_utc = end.astimezone(ZoneInfo("UTC"))

    ics_content = "\r\n".join([
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ClubSync//Calendar Export//EN",
        "BEGIN:VEVENT",
        f"UID:clubsync-event-{event_id}@clubsync.local",
        f"DTSTAMP:{datetime.now(ZoneInfo('UTC')).strftime('%Y%m%dT%H%M%SZ')}",
        f"DTSTART:{start_utc.strftime('%Y%m%dT%H%M%SZ')}",
        f"DTEND:{end_utc.strftime('%Y%m%dT%H%M%SZ')}",
        f"SUMMARY:{escape_ics(event['title'])}",
        f"DESCRIPTION:{escape_ics(event['description'])}",
        f"LOCATION:{escape_ics(event['location'])}",
        "END:VEVENT",
        "END:VCALENDAR",
        ""
    ])

    return Response(
        ics_content,
        mimetype="text/calendar",
        headers={
            "Content-Disposition":
                f'attachment; filename="event_{event_id}.ics"'
        }
    )
