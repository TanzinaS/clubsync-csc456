import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app


class TestCORS(unittest.TestCase):

    def test_default_local_origins(self):
        with patch.dict(os.environ, {"FRONTEND_ORIGIN": ""}):
            os.environ.pop("FRONTEND_ORIGIN", None)
            app = create_app()
            client = app.test_client()

            for origin in (
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ):
                with self.subTest(origin=origin):
                    response = client.get(
                        "/api/health",
                        headers={"Origin": origin}
                    )
                    self.assertEqual(
                        response.headers.get("Access-Control-Allow-Origin"),
                        origin
                    )

    def test_configured_origin_allowed(self):
        origin = "https://clubsync.example.com"

        with patch.dict(
            os.environ,
            {"FRONTEND_ORIGIN": origin + "/"}
        ):
            app = create_app()
            response = app.test_client().get(
                "/api/health",
                headers={"Origin": origin}
            )

            self.assertEqual(
                response.headers.get("Access-Control-Allow-Origin"),
                origin
            )

    def test_unrelated_origin_denied(self):
        with patch.dict(
            os.environ,
            {"FRONTEND_ORIGIN": "https://clubsync.example.com"}
        ):
            app = create_app()
            response = app.test_client().get(
                "/api/health",
                headers={"Origin": "https://unrelated.example.com"}
            )

            self.assertIsNone(
                response.headers.get("Access-Control-Allow-Origin")
            )


if __name__ == "__main__":
    unittest.main()