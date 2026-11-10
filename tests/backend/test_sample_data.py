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

    def test_get_club_found(self):
        club = sample_data.get_club(6)

        with (sample_data.DATA_DIR / "sample_clubs.json").open(
            "r", encoding="utf-8"
        ) as file:
            original_data = json.load(file)

        expected = next(club for club in original_data if club["id"] == 6)

        self.assertEqual(club, expected)

    def test_get_club_not_found(self):
        self.assertIsNone(sample_data.get_club(999))

    def test_get_event_found(self):
        event = sample_data.get_event(3)

        with (sample_data.DATA_DIR / "sample_events.json").open(
            "r", encoding="utf-8"
        ) as file:
            original_data = json.load(file)

        expected = next(event for event in original_data if event["id"] == 3)

        self.assertEqual(event, expected)

    def test_get_event_not_found(self):
        self.assertIsNone(sample_data.get_event(999))


if __name__ == "__main__":
    unittest.main()

