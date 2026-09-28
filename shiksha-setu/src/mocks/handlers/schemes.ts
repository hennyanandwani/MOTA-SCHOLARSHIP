import { http, HttpResponse, delay } from 'msw';

import { getDb } from '../seed/db';

// ─── Scheme Handlers ──────────────────────────────────────────────────────────

export const schemeHandlers = [
  // GET /api/schemes - list all schemes
  http.get('/api/schemes', async ({ request }) => {
    await delay({ min: 300, max: 800 });
    const db = await getDb();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');

    let schemes = db.schemes;
    if (category) schemes = schemes.filter((s) => s.category === category);
    if (status) schemes = schemes.filter((s) => s.status === status);

    return HttpResponse.json({ data: schemes, total: schemes.length });
  }),

  // GET /api/schemes/:id - get single scheme
  http.get('/api/schemes/:id', async ({ params }) => {
    await delay({ min: 200, max: 500 });
    const db = await getDb();
    const scheme = db.schemes.find((s) => s.id === params.id || s.slug === params.id);

    if (!scheme) {
      return HttpResponse.json({ error: 'Scheme not found' }, { status: 404 });
    }

    return HttpResponse.json({ data: scheme });
  }),

  // GET /api/schemes/:id/versions - version history stub
  http.get('/api/schemes/:id/versions', async ({ params }) => {
    await delay(300);
    const db = await getDb();
    const scheme = db.schemes.find((s) => s.id === params.id);
    if (!scheme) return HttpResponse.json({ error: 'Not found' }, { status: 404 });

    // Return illustrative version history
    const versions = Array.from({ length: scheme.version.number }, (_, i) => ({
      number: i + 1,
      publishedAt: new Date(Date.now() - (scheme.version.number - i) * 30 * 86400000).toISOString(),
      publishedBy: 'scheme_admin',
      changeNote: i === scheme.version.number - 1 ? scheme.version.changeNote : `Version ${i + 1} update`,
    }));

    return HttpResponse.json({ data: versions });
  }),
];
