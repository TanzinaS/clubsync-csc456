
import json
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


class DataUnavailableError(Exception):
    """Raised when shared JSON data cannot be loaded."""
    pass


def load_sample_clubs():
    file_path = DATA_DIR / "sample_clubs.json"

    try:
        with file_path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError) as error:
        raise DataUnavailableError(
            "Unable to load club data"
        ) from error


def load_sample_events():
    file_path = DATA_DIR / "sample_events.json"

    try:
        with file_path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError) as error:
        raise DataUnavailableError(
            "Unable to load event data"
        ) from error


def get_club(club_id):
    clubs = load_sample_clubs()
    return next(
        (club for club in clubs if club["id"] == club_id),
        None
    )


def get_event(event_id):
    events = load_sample_events()
    return next(
        (event for event in events if event["id"] == event_id),
        None
    )


def sorted_events(events):
    return sorted(
        events,
        key=lambda event: (
            datetime.fromisoformat(
                event["start_time"].replace("Z", "+00:00")
            ),
            event["id"]
        )
    )
