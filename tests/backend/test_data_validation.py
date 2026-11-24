import json
import re
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"

CATEGORIES = {
    "Tech",
    "Cultural",
    "Arts",
    "Academic",
    "Sports",
    "Faith",
    "Social",
    "Community Service",
    "Other",
}

NEW_YORK = ZoneInfo("America/New_York")

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def load_json(filename):
    """Load JSON data directly from the data directory."""
    with (DATA_DIR / filename).open("r", encoding="utf-8") as file:
        return json.load(file)


class TestDataValidation(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.clubs = load_json("sample_clubs.json")
        cls.events = load_json("sample_events.json")

    def test_club_ids_are_unique(self):
        seen = set()

        for club in self.clubs:
            club_id = club["id"]

            self.assertNotIn(
                club_id,
                seen,
                f"Club ID {club_id!r}, field 'id': duplicate ID"
            )

            seen.add(club_id)

    def test_event_ids_are_unique(self):
        seen = set()

        for event in self.events:
            event_id = event["id"]

            self.assertNotIn(
                event_id,
                seen,
                f"Event ID {event_id!r}, field 'id': duplicate ID"
            )

            seen.add(event_id)

    def test_event_club_ids_exist(self):
        club_ids = {club["id"] for club in self.clubs}

        for event in self.events:
            self.assertIn(
                event["club_id"],
                club_ids,
                f"Event ID {event['id']}, field 'club_id': "
                f"unknown club ID {event['club_id']!r}"
            )

    def test_event_tags_are_valid(self):
        for event in self.events:
            event_id = event["id"]
            tags = event["tags"]

            self.assertIsInstance(
                tags,
                list,
                f"Event ID {event_id}, field 'tags': must be a list"
            )

            self.assertTrue(
                tags,
                f"Event ID {event_id}, field 'tags': must not be empty"
            )

            self.assertIn(
                tags[0],
                CATEGORIES,
                f"Event ID {event_id}, field 'tags[0]': "
                f"invalid display category {tags[0]!r}"
            )

    def test_event_timestamps_have_new_york_offset(self):
        timestamp_fields = ("start_time", "end_time")

        for event in self.events:
            event_id = event["id"]

            for field in timestamp_fields:
                value = event[field]

                try:
                    timestamp = datetime.fromisoformat(
                        value.replace("Z", "+00:00")
                    )
                except (ValueError, AttributeError):
                    self.fail(
                        f"Event ID {event_id}, field '{field}': "
                        f"invalid timestamp {value!r}"
                    )

                self.assertIsNotNone(
                    timestamp.utcoffset(),
                    f"Event ID {event_id}, field '{field}': "
                    "timestamp must include a timezone offset"
                )

                expected_offset = timestamp.astimezone(
                    NEW_YORK
                ).utcoffset()

                self.assertEqual(
                    timestamp.utcoffset(),
                    expected_offset,
                    f"Event ID {event_id}, field '{field}': "
                    f"incorrect New York UTC offset "
                    f"{timestamp.utcoffset()}, expected {expected_offset}"
                )

    def test_club_contact_emails_are_valid(self):
        for club in self.clubs:
            email = club["contact_email"]

            self.assertIsInstance(
                email,
                str,
                f"Club ID {club['id']}, field 'contact_email': "
                "must be a string"
            )

            self.assertRegex(
                email,
                EMAIL_PATTERN,
                f"Club ID {club['id']}, field 'contact_email': "
                f"invalid email address {email!r}"
            )

    def test_club_names_are_not_empty(self):
        for club in self.clubs:
            self.assertTrue(
                isinstance(club["name"], str) and club["name"].strip(),
                f"Club ID {club['id']}, field 'name': "
                "must not be empty"
            )

    def test_event_titles_are_not_empty(self):
        for event in self.events:
            self.assertTrue(
                isinstance(event["title"], str) and event["title"].strip(),
                f"Event ID {event['id']}, field 'title': "
                "must not be empty"
            )


if __name__ == "__main__":
    unittest.main()
