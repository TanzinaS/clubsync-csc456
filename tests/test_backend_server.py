
import sys
from pathlib import Path
import unittest
from unittest.mock import patch

sys.path.insert(
    0, str(Path(__file__).resolve().parents[1] / "backend")
)

from app import create_app
from services.sample_data import load_sample_events, sorted_events


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

        # Verify the exact chronological event order.
        expected_ids = [
            1, 2, 3, 4, 5, 6,
            7, 8, 9, 10, 12, 11
        ]

        actual_ids = [event["id"] for event in events]
        self.assertEqual(actual_ids, expected_ids)

        # All required fields must be present.
        required_fields = {
            "id",
            "club_id",
            "title",
            "description",
            "location",
            "start_time",
            "end_time",
            "tags"
        }

        for event in events:
            self.assertTrue(
                required_fields.issubset(event.keys())
            )

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

    # Issue #82: Past events must also be returned.
    @patch("api.events.load_sample_events")
    def test_get_events_includes_past_events(self, mock_load):
        past_event = {
            "id": 100,
            "club_id": 1,
            "title": "Past Club Event",
            "description": "An event from the past.",
            "location": "CCNY Campus",
            "start_time": "2020-01-01T10:00:00Z",
            "end_time": "2020-01-01T11:00:00Z",
            "tags": []
        }

        mock_load.return_value = [past_event]

        response = self.client.get("/api/events")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            [past_event]
        )

    # Issue #82: Events must be sorted by actual
    # chronological time across different time zones.
    def test_events_different_timezones(self):
        events = [
            {
                "id": 1,
                "start_time": "2026-11-10T10:00:00-05:00"
            },
            {
                "id": 2,
                "start_time": "2026-11-10T14:00:00Z"
            },
            {
                "id": 3,
                "start_time": "2026-11-10T15:30:00+01:00"
            }
        ]

        result = sorted_events(events)

        actual_ids = [
            event["id"] for event in result
        ]

        self.assertEqual(actual_ids, [2, 3, 1])

    # Issue #82: Events with identical start times
    # must be sorted by event ID.
    def test_events_same_start_time(self):
        events = [
            {
                "id": 5,
                "start_time": "2026-11-10T10:00:00Z"
            },
            {
                "id": 2,
                "start_time": "2026-11-10T10:00:00Z"
            },
            {
                "id": 3,
                "start_time": "2026-11-10T10:00:00Z"
            }
        ]

        result = sorted_events(events)

        actual_ids = [
            event["id"] for event in result
        ]

        self.assertEqual(actual_ids, [2, 3, 5])

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
        self.assertEqual(
            events[0]["title"],
            "Proofs & Pastries"
        )

    def test_filter_events_by_club_2(self):
        response = self.client.get("/api/events?club_id=2")

        self.assertEqual(response.status_code, 200)

        events = response.get_json()
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["club_id"], 2)
        self.assertEqual(
            events[0]["title"],
            "Roblox Game Jam"
        )

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
        self.assertEqual(
            response.get_json(),
            []
        )

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
