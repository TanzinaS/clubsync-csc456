import sys
import json
from pathlib import Path
import unittest

sys.path.insert(
    0, str(Path(__file__).resolve().parents[2] / "backend")
)

from services import sample_data


class TestSampleData(unittest.TestCase):

    def test_load_sample_clubs(self):
        clubs = sample_data.load_sample_clubs()

        self.assertEqual(len(clubs), 14)

        required_fields = {
            "id",
            "name",
            "category",
            "description",
            "contact_email"
        }

        for club in clubs:
            self.assertTrue(required_fields.issubset(club.keys()))

        with (sample_data.DATA_DIR / "sample_clubs.json").open(
            "r", encoding="utf-8"
        ) as file:
            original_data = json.load(file)

        self.assertEqual(clubs, original_data)

    def test_load_sample_events(self):
        events = sample_data.load_sample_events()

        self.assertEqual(len(events), 12)

        required_fields = {
            "id",
            "club_id",
            "title",
            "description",
            "start_time",
            "end_time",
            "location",
            "tags"
        }

        for event in events:
            self.assertTrue(required_fields.issubset(event.keys()))

        with (sample_data.DATA_DIR / "sample_events.json").open(
            "r", encoding="utf-8"
        ) as file:
            original_data = json.load(file)

        self.assertEqual(events, original_data)


if __name__ == "__main__":
    unittest.main()
