
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

    def test_get_events(self):
        response = self.client.get("/api/events")

        self.assertEqual(response.status_code, 200)

        events = response.get_json()

        # Check all 12 events are returned.
        self.assertEqual(len(events), 12)

        # Check events are sorted by start_time, then ID.
        expected = sorted(
            events,
            key=lambda event: (event["start_time"], event["id"])
        )
        self.assertEqual(events, expected)

        # Check every event has the required fields.
        required_fields = {
            "id", "club_id", "title", "description",
            "location", "start_time", "end_time", "tags"
        }

        for event in events:
            self.assertTrue(required_fields.issubset(event.keys()))

    # Issue #16: Return the requested event by ID.
    def test_get_event_details(self):
        response = self.client.get("/api/events/2")

        self.assertEqual(response.status_code, 200)

        event = response.get_json()

        self.assertEqual(event["id"], 2)

        # Verify event details match the shared JSON data.
        from services.sample_data import load_sample_events

        expected_event = next(
            event for event in load_sample_events()
            if event["id"] == 2
        )

        self.assertEqual(event, expected_event)

    # Issue #16: Invalid event IDs return 404.
    def test_get_event_details_not_found(self):
        response = self.client.get("/api/events/999")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json()["error"],
            "Event not found"
        )

    # Issue #17: Filter events by Club 1.
    def test_filter_events_by_club_1(self):
        response = self.client.get("/api/events?club_id=1")

        self.assertEqual(response.status_code, 200)

        events = response.get_json()
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["club_id"], 1)
        self.assertEqual(events[0]["title"], "Proofs & Pastries")

    # Issue #17: Filter events by Club 2.
    def test_filter_events_by_club_2(self):
        response = self.client.get("/api/events?club_id=2")

        self.assertEqual(response.status_code, 200)

        events = response.get_json()
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["club_id"], 2)
        self.assertEqual(events[0]["title"], "Roblox Game Jam")

    # Issue #17: A club with no events returns an empty list.
    def test_filter_events_invalid_club(self):
        response = self.client.get("/api/events?club_id=999")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])


if __name__ == "__main__":
    unittest.main()