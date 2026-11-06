import unittest

from backend.app import create_app
from services.demo_user import DEMO_USER

class TestCurrentUser(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        DEMO_USER["followed_clubs"].clear()

    def test_get_current_user(self):
        response = self.client.get("/api/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {
            "id": 1,
            "name": "Demo User",
            "followed_clubs": []
        })

    def test_followed_clubs_updated(self):
        self.client.post("/api/clubs/1/follow")

        response = self.client.get("/api/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json()["followed_clubs"], [1]
        )


if __name__ == "__main__":
    unittest.main()