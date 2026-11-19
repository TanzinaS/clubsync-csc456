
import sys
import unittest
from pathlib import Path

sys.path.insert(
    0, str(Path(__file__).resolve().parents[2] / "backend")
)

from app import create_app


class TestClubEndpoints(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_club_fields_and_unique_ids(self):
        response = self.client.get("/api/clubs")
        clubs = response.get_json()

        self.assertEqual(response.status_code, 200)

        ids = []

        for club in clubs:
            self.assertIn("id", club)
            self.assertIn("name", club)
            self.assertIn("description", club)
            self.assertIn("category", club)
            self.assertIn("contact_email", club)
            ids.append(club["id"])

        self.assertEqual(
            len(ids),
            len(set(ids)),
            "Club IDs must be unique"
        )

    def test_unknown_endpoint_returns_404(self):
        response = self.client.get("/api/does-not-exist")

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
 