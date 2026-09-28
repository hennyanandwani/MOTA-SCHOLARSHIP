import { http, HttpResponse, delay } from 'msw';

import { getDb, persistDb } from '../seed/db';
import type { Application, AuditEvent } from '@/types';
import { applyTransition } from '@/lib/workflow';
import { ALL_SCHEMES } from '../seed/db';

// ─── Application Handlers ─────────────────────────────────────────────────────

export const applicationHandlers = [
  // GET /api/applications - list with filter/paginate
  http.get('/api/applications', async ({ request }) => {
    await delay({ min: 300, max: 700 });
    const db = await getDb();
    const url = new URL(request.url);

    const schemeId = url.searchParams.get('schemeId');
    const status = url.searchParams.get('status');
    const applicantId = url.searchParams.get('applicantId');
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20');

    let apps = db.applications;
    if (schemeId) apps = apps.filter((a) => a.schemeId === schemeId);
    if (status) apps = apps.filter((a) => a.status === status);
    if (applicantId) apps = apps.filter((a) => a.applicantId === applicantId);

    const total = apps.length;
    const start = (page - 1) * pageSize;
    const paginated = apps.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }),

  // GET /api/applications/:id - get single application
  http.get('/api/applications/:id', async ({ params }) => {
    await delay({ min: 200, max: 500 });
    const db = await getDb();
    const app = db.applications.find((a) => a.id === params.id);

    if (!app) return HttpResponse.json({ error: 'Not found' }, { status: 404 });

    // Enrich with applicant profile and scheme info
    const profile = db.profiles.find((p) => p.userId === app.applicantId);
    const scheme = ALL_SCHEMES.find((s) => s.id === app.schemeId);
    const auditTrail = db.auditEvents.filter((e) => e.applicationId === app.id);

    return HttpResponse.json({ data: { ...app, profile, scheme, auditTrail } });
  }),

  // POST /api/applications - create application
  http.post('/api/applications', async ({ request }) => {
    await delay({ min: 300, max: 600 });
    const db = await getDb();
    const body = await request.json() as Partial<Application>;

    const scheme = ALL_SCHEMES.find((s) => s.id === body.schemeId);
    if (!scheme) return HttpResponse.json({ error: 'Scheme not found' }, { status: 400 });

    const newApp: Application = {
      id: `app-${Date.now()}`,
      schemeId: body.schemeId!,
      schemeVersion: scheme.version.number,
      applicantId: body.applicantId!,
      stageKey: 'draft',
      status: 'draft',
      formData: body.formData ?? {},
      isAssistedMode: body.isAssistedMode ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.applications.push(newApp);
    await persistDb(db);

    return HttpResponse.json({ data: newApp }, { status: 201 });
  }),

  // PATCH /api/applications/:id - update form data
  http.patch('/api/applications/:id', async ({ params, request }) => {
    await delay({ min: 200, max: 400 });
    const db = await getDb();
    const idx = db.applications.findIndex((a) => a.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json() as Partial<Application>;
    db.applications[idx] = { ...db.applications[idx], ...body, updatedAt: new Date().toISOString() };
    await persistDb(db);

    return HttpResponse.json({ data: db.applications[idx] });
  }),

  // POST /api/applications/:id/transition - workflow transition
  http.post('/api/applications/:id/transition', async ({ params, request }) => {
    await delay({ min: 300, max: 700 });
    const db = await getDb();
    const app = db.applications.find((a) => a.id === params.id);
    if (!app) return HttpResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json() as { toStage: string; actorId: string; actorRole: string; reason?: string };
    const scheme = ALL_SCHEMES.find((s) => s.id === app.schemeId);
    if (!scheme) return HttpResponse.json({ error: 'Scheme not found' }, { status: 400 });

    const result = applyTransition(
      app,
      body.toStage,
      { id: body.actorId, role: body.actorRole as Application['status'] extends string ? never : never },
      body.reason,
      scheme
    );

    if ('error' in result) {
      return HttpResponse.json({ error: result.error }, { status: 400 });
    }

    const appIdx = db.applications.findIndex((a) => a.id === params.id);
    db.applications[appIdx] = result.app;
    db.auditEvents.push(result.auditEvent);
    await persistDb(db);

    return HttpResponse.json({ data: result });
  }),

  // GET /api/applications/:id/audit - audit trail
  http.get('/api/applications/:id/audit', async ({ params }) => {
    await delay(200);
    const db = await getDb();
    const events = db.auditEvents.filter((e) => e.applicationId === params.id);
    return HttpResponse.json({ data: events });
  }),

  // GET /api/stats - dashboard stats
  http.get('/api/stats', async () => {
    await delay({ min: 400, max: 800 });
    const db = await getDb();

    return HttpResponse.json({
      data: {
        // ILLUSTRATIVE NUMBERS for demo purposes
        schemesLive: db.schemes.filter((s) => s.status === 'published').length,
        totalApplications: db.applications.length,
        disbursed: db.applications.filter((a) => a.status === 'selected').length,
        avgDaysToProcess: 21, // illustrative
      },
    });
  }),
];
