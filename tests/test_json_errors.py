
import sys
import json
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(
    0, str(Path(__file__).resolve().parents[1] / "backend")
)

from app import create_app


class TestJsonErrors(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_404_not_found(self):
        response = self.client.get("/api/does-not-exist")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json(),
            {"error": "Not found"}
        )

    def test_404_invalid_club_id(self):
        response = self.client.get("/api/clubs/abc")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json(),
            {"error": "Not found"}
        )

    def test_405_method_not_allowed(self):
        response = self.client.delete("/api/clubs/1/follow")

        self.assertEqual(response.status_code, 405)
        self.assertEqual(
            response.get_json(),
            {"error": "Method not allowed"}
        )

        # Check that the Allow header is preserved.
        self.assertIn("Allow", response.headers)
        self.assertIn("POST", response.headers["Allow"])

    def test_500_internal_server_error(self):
        @self.app.get("/api/test-error")
        def test_error():
            raise RuntimeError("Test server error")

        # Allow Flask to handle the exception as HTTP 500.
        self.app.config["PROPAGATE_EXCEPTIONS"] = False

        response = self.client.get("/api/test-error")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.get_json(),
            {"error": "Internal server error"}
        )

    def test_500_missing_data_file(self):
        @self.app.get("/api/test-missing-data")
        def test_missing_data():
            from services.sample_data import load_sample_events
            return load_sample_events()

        with patch(
            "pathlib.Path.open",
            side_effect=FileNotFoundError("Missing file")
        ):
            response = self.client.get("/api/test-missing-data")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.get_json(),
            {"error": "Data unavailable"}
        )

    def test_500_invalid_json_data(self):
        @self.app.get("/api/test-invalid-json")
        def test_invalid_json():
            from services.sample_data import load_sample_events
            return load_sample_events()

        with patch(
            "services.sample_data.json.load",
            side_effect=json.JSONDecodeError(
                "Invalid JSON", "", 0
            )
        ):
            response = self.client.get("/api/test-invalid-json")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.get_json(),
            {"error": "Data unavailable"}
        )

    def test_500_missing_clubs_data_file(self):
        @self.app.get("/api/test-missing-clubs")
        def test_missing_clubs():
            from services.sample_data import load_sample_clubs
            return load_sample_clubs()

        with patch(
            "pathlib.Path.open",
            side_effect=FileNotFoundError("Missing clubs file")
        ):
            response = self.client.get("/api/test-missing-clubs")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.get_json(),
            {"error": "Data unavailable"}
        )

    def test_400_invalid_event_club_id(self):
        response = self.client.get("/api/events?club_id=abc")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json(),
            {"error": "Invalid club_id"}
        )


if __name__ == "__main__":
    unittest.main()
