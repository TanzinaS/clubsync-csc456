
import sys
from datetime import date
from pathlib import Path
import unittest
from unittest.mock import patch

sys.path.insert(
    0, str(Path(__file__).resolve().parents[1] / "backend")
)

from app import create_app


class TestBackendServer(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_home(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json()["status"],
            "running"
        )

    def test_health(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json()["status"],
            "ok"
        )

    def test_get_clubs(self):
        response = self.client.get("/api/clubs")

        self.assertEqual(response.status_code, 200)

        clubs = response.get_json()
        self.assertEqual(len(clubs), 3)
        self.assertEqual(clubs[0]["name"], "Computer Science Club")
        self.assertEqual(clubs[1]["name"], "Robotics Club")
        self.assertEqual(clubs[2]["name"], "Photography Club")

    # Pretend today is before all sample events.
    @patch("api.events.date")
    def test_get_events(self, mock_date):
        mock_date.today.return_value = date(2026, 1, 1)

        response = self.client.get("/api/events")

        self.assertEqual(response.status_code, 200)

        events = response.get_json()
        self.assertEqual(len(events), 3)
        self.assertEqual(events[0]["title"], "Computer Science Workshop")
        self.assertEqual(events[1]["title"], "Robotics Competition")
        self.assertEqual(events[2]["title"], "Photography Walk")

    # Issue #16: Return the requested event by ID.
    def test_get_event_details(self):
        response = self.client.get("/api/events/2")

        self.assertEqual(response.status_code, 200)

        event = response.get_json()
        self.assertEqual(event["id"], 2)
        self.assertEqual(event["club_id"], 2)
        self.assertEqual(event["title"], "Robotics Competition")
        self.assertEqual(event["date"], "2026-11-12")
        self.assertEqual(event["location"], "CCNY Campus")
        self.assertEqual(
            event["description"],
            "Join a robotics competition."
        )

    # Issue #16: Invalid event IDs return 404.
    def test_get_event_details_not_found(self):
        response = self.client.get("/api/events/999")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json()["error"],
            "Event not found"
        )


if __name__ == "__main__":
    unittest.main()
