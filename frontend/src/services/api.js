const LOCAL_API_URL = 'http://127.0.0.1:5001';
const REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(method, path) {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || LOCAL_API_URL).replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/${path.replace(/^\/+/, '')}`, {
      method,
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      // Keep the timeout active until the response body has finished loading.
      if (controller.signal.aborted || !(error instanceof SyntaxError)) throw error;
      throw new ApiError(response.ok ? 'Invalid JSON response' : `Request failed (HTTP ${response.status})`, response.status);
    }

    if (!response.ok) {
      const message = typeof data?.error === 'string' && data.error.trim()
        ? data.error : `Request failed (HTTP ${response.status})`;
      throw new ApiError(message, response.status);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(controller.signal.aborted ? 'Request timed out' : 'Network request failed');
  } finally {
    clearTimeout(timeout);
  }
}

export const apiGet = path => request('GET', path);
// V1 follow/unfollow requests have no body, so no Content-Type is needed.
export const apiPost = path => request('POST', path);

export const getClubs = () => apiGet('/api/clubs');
export const getEvents = () => apiGet('/api/events');
export const getMe = () => apiGet('/api/me');
export const getPersonalizedEvents = () => apiGet('/api/events/personalized');
export const followClub = id => apiPost(`/api/clubs/${encodeURIComponent(id)}/follow`);
export const unfollowClub = id => apiPost(`/api/clubs/${encodeURIComponent(id)}/unfollow`);
