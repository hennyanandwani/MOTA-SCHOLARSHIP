import { http, HttpResponse, delay } from 'msw';
import { getDb } from '../seed/db';

export const statsHandlers = [
  http.get('/api/stats', async () => {
    await delay({ min: 400, max: 800 });
    const db = await getDb();
    return HttpResponse.json({
      data: {
        // ILLUSTRATIVE NUMBERS for demo. Not actual ministry data.
        schemesLive: db.schemes.filter((s) => s.status === 'published').length,
        totalApplications: db.applications.length,
        disbursed: db.applications.filter((a) => a.status === 'selected').length,
        avgDaysToProcess: 21,
      },
    });
  }),
];

export const notificationHandlers = [
  http.get('/api/notifications', async ({ request }) => {
    await delay(300);
    const db = await getDb();
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const notifs = userId ? db.notifications.filter((n) => n.userId === userId) : db.notifications;
    return HttpResponse.json({ data: notifs, total: notifs.length });
  }),

  http.patch('/api/notifications/:id/read', async ({ params }) => {
    await delay(200);
    const db = await getDb();
    const n = db.notifications.find((n) => n.id === params.id);
    if (n) n.read = true;
    return HttpResponse.json({ data: { ok: true } });
  }),
];
