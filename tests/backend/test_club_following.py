
import sys
import unittest
from pathlib import Path

sys.path.insert(
    0, str(Path(__file__).resolve().parents[2] / "backend")
)

from app import create_app
from services.demo_user import (
    DEMO_USER,
    follow_club,
    unfollow_club,
    reset_demo_user
)


class TestClubFollowing(unittest.TestCase):

    def setUp(self):
        # Reset demo user before every test.
        reset_demo_user()

    def test_follow_club(self):
        # Following a club adds it to the list.
        follow_club(1)
        self.assertIn(1, DEMO_USER["followed_clubs"])

    def test_follow_club_no_duplicates(self):
        # Following the same club twice shouldn't duplicate it.
        follow_club(1)
        follow_club(1)

        self.assertEqual(
            DEMO_USER["followed_clubs"],
            [1]
        )

    def test_unfollow_club(self):
        # Following, then unfollowing removes the club.
        follow_club(1)
        unfollow_club(1)

        self.assertNotIn(1, DEMO_USER["followed_clubs"])

    def test_unfollow_club_not_followed(self):
        unfollow_club(99)

        self.assertEqual(
            DEMO_USER["followed_clubs"],
            []
        )

    def test_follow_club_6_api(self):
        app = create_app()
        client = app.test_client()

        response = client.post("/api/clubs/6/follow")

        self.assertEqual(response.status_code, 200)
        self.assertIn(6, response.get_json()["followed_clubs"])


if __name__ == "__main__":
    unittest.main()
