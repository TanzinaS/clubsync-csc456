import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def load_sample_clubs():
    file_path = DATA_DIR / "sample_clubs.json"
    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_sample_events():
    file_path = DATA_DIR / "sample_events.json"
    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)
from datetime import datetime


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


def get_club(club_id):
    clubs = load_sample_clubs()
    return next(
        (club for club in clubs if club["id"] == club_id),
        None
    )
