import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { requireEnvironmentVariable } from '@/lib/env';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

type RouteContext = {
  params: Promise<{ applicationNumber: string; documentId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { applicationNumber, documentId } = await params;
  try {
    const application = await prisma.scholarshipApplication.findUnique({
      where: { applicationNumber },
      select: { id: true },
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    const document = await prisma.applicationDocument.findFirst({
      where: { id: documentId, applicationId: application.id },
      select: { storagePath: true, originalName: true },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    let supabaseUrl: string;
    let supabaseSecret: string;
    try {
      ({ url: supabaseUrl } = getSupabasePublicConfig());
      supabaseSecret = requireEnvironmentVariable(
        'SUPABASE_SECRET_KEY',
        process.env.SUPABASE_SECRET_KEY,
      );
    } catch (configurationError) {
      console.error(
        'Admin document storage configuration is invalid:',
        configurationError instanceof Error ? configurationError.message : 'Unknown error',
      );
      return NextResponse.json({ error: 'Server storage configuration is missing.' }, { status: 500 });
    }
    const supabase = createSupabaseClient(supabaseUrl, supabaseSecret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await supabase.storage
      .from('scholarship-documents')
      .createSignedUrl(document.storagePath, 60, { download: document.originalName });
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Unable to authorize document access.' }, { status: 502 });
    }

    return NextResponse.redirect(data.signedUrl, 302);
  } catch (error) {
    console.error('Admin document access failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Unable to open document.' }, { status: 500 });
  }
}
