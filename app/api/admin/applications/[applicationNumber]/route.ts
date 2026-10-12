import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminApplicationDetail } from '@/lib/adminApplicationData';

type RouteContext = { params: Promise<{ applicationNumber: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { applicationNumber } = await params;
  try {
    const application = await getAdminApplicationDetail(applicationNumber);
    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    console.error('Admin application detail query failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Unable to load application details.' }, { status: 500 });
  }
}
