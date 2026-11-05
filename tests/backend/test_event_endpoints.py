
import sys
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

sys.path.insert(
    0, str(Path(__file__).resolve().parents[2] / "backend")
)

from app import create_app


class TestEventEndpoints(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    @patch("api.events.date")
    def test_past_events_are_hidden(self, mock_date):
        # Pretend today is November 15, 2026.
        mock_date.today.return_value = date(2026, 11, 15)

        response = self.client.get("/api/events")

        self.assertEqual(response.status_code, 200)

        events = response.get_json()

        # Only the November 20 event should remain.
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["title"], "Photography Walk")

        for event in events:
            self.assertGreaterEqual(
                event["date"], "2026-11-15"
            )

    @patch("api.events.date")
    def test_event_fields_and_club_ids(self, mock_date):
        # Include all sample events.
        mock_date.today.return_value = date(2026, 1, 1)

        events_response = self.client.get("/api/events")
        clubs_response = self.client.get("/api/clubs")

        self.assertEqual(events_response.status_code, 200)
        self.assertEqual(clubs_response.status_code, 200)

        events = events_response.get_json()
        clubs = clubs_response.get_json()

        valid_club_ids = {club["id"] for club in clubs}

        self.assertGreater(len(events), 0)

        required_fields = {
            "id", "club_id", "title", "date", "location"
        }

        for event in events:
            for field in required_fields:
                self.assertIn(field, event)

            self.assertIn(
                event["club_id"],
                valid_club_ids,
                "Event references an unknown club"
            )


if __name__ == "__main__":
    unittest.main()
