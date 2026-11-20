import * as Sentry from '@sentry/browser';

// Sentry stays off unless VITE_SENTRY_DSN is set, so local dev and tests run without it.
const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();

if (dsn) {
  const apiOrigin = (import.meta.env.VITE_API_BASE_URL?.trim() || 'http://127.0.0.1:5001').replace(/\/+$/, '');
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    // Every trace in dev, 10% in production builds.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Send trace headers only to our API, so frontend and backend traces connect.
    tracePropagationTargets: [apiOrigin],
    // Record a replay only for sessions that hit an error. Text and inputs are masked by default.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}
