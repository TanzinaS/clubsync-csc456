
import json
import socket
import subprocess
import sys
import time
import unittest
import urllib.request
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[2] / "backend"
PORT = 5055
HEALTH_URL = f"http://127.0.0.1:{PORT}/api/health"


class TestBackendStartup(unittest.TestCase):

    def setUp(self):
        # Make sure the port is free before starting Flask.
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", PORT))

        # Start the real Flask backend.
        self.server = subprocess.Popen(
            [
                sys.executable,
                "-m", "flask",
                "--app", "app",
                "run",
                "--host", "127.0.0.1",
                "--port", str(PORT),
                "--no-reload",
            ],
            cwd=BACKEND_DIR,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    def test_health_endpoint(self):
        # Allow up to 10 seconds for Flask to start.
        deadline = time.monotonic() + 10

        while time.monotonic() < deadline:
            if self.server.poll() is not None:
                self.fail("Flask server exited before starting")

            try:
                with urllib.request.urlopen(
                    HEALTH_URL, timeout=1
                ) as response:
                    self.assertEqual(response.status, 200)

                    data = json.load(response)
                    self.assertEqual(data["status"], "ok")
                    return

            except (OSError, TimeoutError):
                time.sleep(0.2)

        self.fail("Flask server did not start within 10 seconds")

    def tearDown(self):
        # Always shut down the server after testing.
        if hasattr(self, "server"):
            self.server.terminate()

            try:
                self.server.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.server.kill()
                self.server.wait()


if __name__ == "__main__":
    unittest.main()
=