import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminApplicationSummaries } from '@/lib/adminApplicationData';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    return NextResponse.json({ applications: await getAdminApplicationSummaries() });
  } catch (error) {
    console.error('Admin application list query failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Unable to load applications.' }, { status: 500 });
  }
}
