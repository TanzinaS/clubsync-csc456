
import sys
import unittest
from pathlib import Path

sys.path.insert(
    0, str(Path(__file__).resolve().parents[2] / "backend")
)

from app import create_app
from services.demo_user import reset_demo_user


class TestAPIContract(unittest.TestCase):

    def setUp(self):
        reset_demo_user()
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def assert_user_contract(self, user):
        # Section 3.4: Exact V1 user fields
        self.assertEqual(
            set(user.keys()),
            {"id", "name", "followed_clubs"}
        )

        self.assertIs(type(user["id"]), int)
        self.assertIs(type(user["name"]), str)
        self.assertIs(type(user["followed_clubs"]), list)

        for club_id in user["followed_clubs"]:
            self.assertIs(type(club_id), int)

    def assert_event_contract(self, event):
        # Section 3.3: Exact V1 event fields
        self.assertEqual(
            set(event.keys()),
            {
                "id",
                "club_id",
                "title",
                "description",
                "start_time",
                "end_time",
                "location",
                "tags",
            }
        )

        self.assertIs(type(event["id"]), int)
        self.assertIs(type(event["club_id"]), int)
        self.assertIs(type(event["title"]), str)
        self.assertIs(type(event["description"]), str)
        self.assertIs(type(event["start_time"]), str)
        self.assertIs(type(event["end_time"]), str)
        self.assertIs(type(event["location"]), str)
        self.assertIs(type(event["tags"]), list)

        for tag in event["tags"]:
            self.assertIs(type(tag), str)

    def test_get_me_contract(self):
        response = self.client.get("/api/me")

        self.assertEqual(response.status_code, 200)
        self.assert_user_contract(response.get_json())

    def test_get_clubs_contract(self):
        response = self.client.get("/api/clubs")

        self.assertEqual(response.status_code, 200)

        clubs = response.get_json()

        self.assertIs(type(clubs), list)
        self.assertGreater(len(clubs), 0)

        for club in clubs:
            # Section 3.2: Exact V1 club fields
            self.assertEqual(
                set(club.keys()),
                {
                    "id",
                    "name",
                    "category",
                    "description",
                    "contact_email",
                }
            )

            self.assertIs(type(club["id"]), int)
            self.assertIs(type(club["name"]), str)
            self.assertIs(type(club["category"]), str)
            self.assertIs(type(club["description"]), str)
            self.assertIs(type(club["contact_email"]), str)

    def test_get_event_details_contract(self):
        response = self.client.get("/api/events/3")

        self.assertEqual(response.status_code, 200)
        self.assert_event_contract(response.get_json())

    def test_personalized_events_contract(self):
        # Follow club 6 so the response contains an event
        follow_response = self.client.post("/api/clubs/6/follow")
        self.assertEqual(follow_response.status_code, 200)

        response = self.client.get("/api/events/personalized")
        self.assertEqual(response.status_code, 200)

        events = response.get_json()

        self.assertIs(type(events), list)
        self.assertGreater(len(events), 0)

        for event in events:
            self.assert_event_contract(event)

    def test_follow_club_contract(self):
        response = self.client.post("/api/clubs/6/follow")

        self.assertEqual(response.status_code, 200)

        user = response.get_json()
        self.assert_user_contract(user)

        # Confirm club 6 was followed
        self.assertIn(6, user["followed_clubs"])

    def test_unfollow_club_contract(self):
        # Follow club 6 first
        follow_response = self.client.post("/api/clubs/6/follow")
        self.assertEqual(follow_response.status_code, 200)

        # Now unfollow club 6
        response = self.client.post("/api/clubs/6/unfollow")

        self.assertEqual(response.status_code, 200)

        user = response.get_json()
        self.assert_user_contract(user)

        # Confirm club 6 was unfollowed
        self.assertNotIn(6, user["followed_clubs"])

    def test_health_contract(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)

        health = response.get_json()

        # Section 4.11: Exact V1 health response
        self.assertEqual(
            set(health.keys()),
            {"status", "service"}
        )

        self.assertIs(type(health["status"]), str)
        self.assertIs(type(health["service"]), str)

        # Check expected values
        self.assertEqual(health["status"], "ok")
        self.assertEqual(health["service"], "ClubSync Backend")


if __name__ == "__main__":
    unittest.main()
