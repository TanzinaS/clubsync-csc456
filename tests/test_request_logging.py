
import io
import logging
import re
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(
    0, str(Path(__file__).resolve().parents[1] / "backend")
)

from app import create_app
from services.sample_data import DataUnavailableError


class TestRequestLogging(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        self.log_output = io.StringIO()
        self.log_handler = logging.StreamHandler(self.log_output)

        self.logger = logging.getLogger("clubsync.backend")
        self.logger.addHandler(self.log_handler)

    def tearDown(self):
        self.logger.removeHandler(self.log_handler)
        self.log_handler.close()

    def test_successful_request_is_logged(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)

        logs = self.log_output.getvalue()

        self.assertIn("GET /api/health", logs)
        self.assertIn("status=200", logs)
        self.assertRegex(
            logs,
            r"duration_ms=\d+(\.\d+)?"
        )

    def test_404_request_is_logged(self):
        response = self.client.get("/api/does-not-exist")

        self.assertEqual(response.status_code, 404)

        logs = self.log_output.getvalue()

        self.assertIn("GET /api/does-not-exist", logs)
        self.assertIn("status=404", logs)

    def test_405_request_is_logged(self):
        response = self.client.post("/api/health")

        self.assertEqual(response.status_code, 405)

        logs = self.log_output.getvalue()

        self.assertIn("POST /api/health", logs)
        self.assertIn("status=405", logs)

    def test_500_error_logs_traceback_and_returns_json(self):
        @self.app.get("/api/test-logging-error")
        def test_error():
            raise RuntimeError("Test logging failure")

        self.app.config["PROPAGATE_EXCEPTIONS"] = False

        response = self.client.get(
            "/api/test-logging-error"
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.get_json(),
            {"error": "Internal server error"}
        )

        logs = self.log_output.getvalue()

        self.assertIn("status=500", logs)
        self.assertIn("RuntimeError", logs)
        self.assertIn("Test logging failure", logs)
        self.assertIn("Traceback", logs)

        self.assertNotIn(
            "Test logging failure",
            response.get_data(as_text=True)
        )

    def test_data_error_logs_traceback_and_returns_json(self):
        @self.app.get("/api/test-data-error")
        def test_data_error():
            raise DataUnavailableError("Missing data")

        response = self.client.get("/api/test-data-error")

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.get_json(),
            {"error": "Data unavailable"}
        )

        logs = self.log_output.getvalue()

        self.assertIn("status=500", logs)
        self.assertIn("DataUnavailableError", logs)
        self.assertIn("Traceback", logs)

        self.assertNotIn(
            "Missing data",
            response.get_data(as_text=True)
        )


if __name__ == "__main__":
    unittest.main()
