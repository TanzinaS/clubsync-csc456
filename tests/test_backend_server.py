
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

    # /api/events only returns upcoming events, so pretend "today" is
    # before every sample event. Otherwise this test fails once the
    # sample dates pass.
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


if __name__ == "__main__":
    unittest.main()
