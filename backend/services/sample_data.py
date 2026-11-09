
import json
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
