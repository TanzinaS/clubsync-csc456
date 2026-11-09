
import sys
from datetime import datetime
from pathlib import Path
import unittest

sys.path.insert(
    0, str(Path(__file__).resolve().parents[1] / "backend")
)

from app import create_app
from services.sample_data import load_sample_events


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

        # All 12 shared events must be returned.
        self.assertEqual(len(events), 12)

        # Sort by actual datetime, then event ID.
        expected = sorted(
            load_sample_events(),
            key=lambda event: (
                datetime.fromisoformat(
                    event["start_time"].replace("Z", "+00:00")
                ),
                event["id"]
            )
        )
        self.assertEqual(events, expected)

        # All required fields must be present.
        required_fields = {
            "id", "club_id", "title", "description",
            "location", "start_time", "end_time", "tags"
        }

        for event in events:
            self.assertTrue(required_fields.issubset(event.keys()))

    # Issue #82: Event 12 must appear before event 11.
    def test_events_chronological_order(self):
        response = self.client.get("/api/events")

        self.assertEqual(response.status_code, 200)

        event_ids = [
            event["id"] for event in response.get_json()
        ]

        self.assertLess(
            event_ids.index(12),
            event_ids.index(11)
        )

    # Issue #82: Return event details from shared JSON.
    def test_get_event_details(self):
        response = self.client.get("/api/events/2")

        self.assertEqual(response.status_code, 200)

        event = response.get_json()
        self.assertEqual(event["id"], 2)

        expected_event = next(
            event for event in load_sample_events()
            if event["id"] == 2
        )

        self.assertEqual(event, expected_event)

    # Unknown event IDs must return JSON 404.
    def test_get_event_details_not_found(self):
        response = self.client.get("/api/events/999")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json(),
            {"error": "Event not found"}
        )

    def test_filter_events_by_club_1(self):
        response = self.client.get("/api/events?club_id=1")

        self.assertEqual(response.status_code, 200)

        events = response.get_json()
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["club_id"], 1)
        self.assertEqual(events[0]["title"], "Proofs & Pastries")

    def test_filter_events_by_club_2(self):
        response = self.client.get("/api/events?club_id=2")

        self.assertEqual(response.status_code, 200)

        events = response.get_json()
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["club_id"], 2)
        self.assertEqual(events[0]["title"], "Roblox Game Jam")

    # Issue #82: Club 6 has event 3.
    def test_filter_events_by_club_6(self):
        response = self.client.get("/api/events?club_id=6")

        self.assertEqual(response.status_code, 200)

        events = response.get_json()
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["id"], 3)
        self.assertEqual(events[0]["club_id"], 6)
        self.assertEqual(
            events[0]["title"],
            "Build Night: Line-Following Bots"
        )

    # A club with no events returns an empty list.
    def test_filter_events_invalid_club(self):
        response = self.client.get("/api/events?club_id=999")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])

    # Invalid club IDs must return HTTP 400.
    def test_filter_events_invalid_club_id(self):
        response = self.client.get("/api/events?club_id=abc")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json(),
            {"error": "Invalid club_id"}
        )


if __name__ == "__main__":
    unittest.main()
