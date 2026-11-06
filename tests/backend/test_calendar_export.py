import unittest
from backend.app import create_app


class TestCalendarExport(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_valid_calendar_export(self):
        response = self.client.get("/api/events/1/calendar")

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/calendar", response.content_type)
        self.assertIn(b"BEGIN:VCALENDAR", response.data)
        self.assertIn(b"BEGIN:VEVENT", response.data)
        self.assertIn(b"END:VCALENDAR", response.data)

    def test_invalid_calendar_export(self):
        response = self.client.get("/api/events/999/calendar")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json(),
            {"error": "Event not found"}
        )


if __name__ == "__main__":
    unittest.main()