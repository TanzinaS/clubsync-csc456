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
