import sys
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

from app import create_app
from services.sample_data import load_sample_events


class TestEventEndpoints(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_all_shared_events_are_returned(self):
        response = self.client.get("/api/events")
        self.assertEqual(response.status_code, 200)

        events = response.get_json()
        self.assertEqual(len(events), 12)

        expected = sorted(
            load_sample_events(),
            key=lambda event: (
                datetime.fromisoformat(event["start_time"].replace("Z", "+00:00")),
                event["id"],
            ),
        )
        self.assertEqual(events, expected)
        self.assertEqual(
            [event["id"] for event in events],
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 11],
        )

    @patch("api.events.load_sample_events")
    def test_past_events_are_included(self, mock_load):
        past_event = {
            "id": 100,
            "club_id": 6,
            "title": "Past Robotics Event",
            "description": "An event from a previous year.",
            "start_time": "2020-01-01T10:00:00-05:00",
            "end_time": "2020-01-01T11:00:00-05:00",
            "location": "CCNY Campus",
            "tags": ["Tech"],
        }
        future_event = {
            **past_event,
            "id": 101,
            "title": "Future Robotics Event",
            "start_time": "2030-01-01T10:00:00-05:00",
            "end_time": "2030-01-01T11:00:00-05:00",
        }
        mock_load.return_value = [future_event, past_event]

        response = self.client.get("/api/events")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [past_event, future_event])

    def test_event_schema_timestamps_and_club_ids(self):
        events_response = self.client.get("/api/events")
        clubs_response = self.client.get("/api/clubs")
        self.assertEqual(events_response.status_code, 200)
        self.assertEqual(clubs_response.status_code, 200)

        events = events_response.get_json()
        valid_club_ids = {club["id"] for club in clubs_response.get_json()}
        required_fields = {
            "id", "club_id", "title", "description",
            "start_time", "end_time", "location", "tags",
        }
        self.assertEqual(len(events), 12)

        for event in events:
            with self.subTest(event_id=event["id"]):
                self.assertEqual(set(event), required_fields)
                self.assertIs(type(event["id"]), int)
                self.assertIs(type(event["club_id"]), int)
                for field in (
                    "title", "description", "start_time", "end_time", "location"
                ):
                    self.assertIsInstance(event[field], str)
                self.assertIsInstance(event["tags"], list)
                self.assertGreaterEqual(len(event["tags"]), 1)
                self.assertTrue(all(isinstance(tag, str) for tag in event["tags"]))
                self.assertNotIn("date", event)
                self.assertIn(event["club_id"], valid_club_ids)

                start = datetime.fromisoformat(event["start_time"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(event["end_time"].replace("Z", "+00:00"))
                self.assertIsNotNone(start.utcoffset())
                self.assertIsNotNone(end.utcoffset())
                self.assertGreater(end, start)

    def test_events_sorted_by_start_time_then_id(self):
        response = self.client.get("/api/events")
        self.assertEqual(response.status_code, 200)
        events = response.get_json()
        keys = [
            (
                datetime.fromisoformat(event["start_time"].replace("Z", "+00:00")),
                event["id"],
            )
            for event in events
        ]
        self.assertEqual(keys, sorted(keys))
        self.assertLess(
            [event["id"] for event in events].index(12),
            [event["id"] for event in events].index(11),
        )

    @patch("api.events.load_sample_events")
    def test_sorting_uses_id_when_start_times_match(self, mock_load):
        sample = load_sample_events()[0]
        mock_load.return_value = [
            {**sample, "id": 9},
            {**sample, "id": 2},
            {**sample, "id": 5},
        ]
        response = self.client.get("/api/events")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([event["id"] for event in response.get_json()], [2, 5, 9])

    def test_filter_events_by_club_id(self):
        response = self.client.get("/api/events?club_id=6")
        self.assertEqual(response.status_code, 200)
        events = response.get_json()
        self.assertEqual([event["id"] for event in events], [3])
        self.assertTrue(all(event["club_id"] == 6 for event in events))

    def test_unknown_club_returns_empty_list(self):
        response = self.client.get("/api/events?club_id=999")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])

    def test_invalid_club_id_returns_400(self):
        response = self.client.get("/api/events?club_id=abc")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": "Invalid club_id"})

    def test_event_details_match_shared_data(self):
        expected = next(event for event in load_sample_events() if event["id"] == 3)
        response = self.client.get("/api/events/3")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), expected)

    def test_unknown_event_returns_404(self):
        response = self.client.get("/api/events/999")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"error": "Event not found"})


if __name__ == "__main__":
    unittest.main()
