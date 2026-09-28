import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

// ─── MSW Browser Worker ───────────────────────────────────────────────────────
// This file sets up the MSW service worker for browser-based mocking.
// The worker intercepts all API requests and returns mock responses.

export const worker = setupWorker(...handlers);
