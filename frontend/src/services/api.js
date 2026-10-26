// All frontend code that talks to the ClubSync backend lives here.
// If the backend address changes, only update API_BASE_URL.

const API_BASE_URL = "http://localhost:5001";

// Returns true if the backend's health check answers with status "ok".
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.status === "ok";
  } catch (error) {
    // Network error: the backend is not running or not reachable.
    return false;
  }
}
