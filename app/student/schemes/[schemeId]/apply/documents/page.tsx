import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { DocumentUpload } from '@/components/student/documents/DocumentUpload';
import { studentNavigation } from '@/lib/navigation';
import { getSchemeWorkflowInfo } from '@/lib/persistedScholarshipScheme';

export default async function DocumentUploadPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;
  const scheme = await getSchemeWorkflowInfo(schemeId);

  if (!scheme) notFound();

  return (
    <div className="min-h-screen">
      <Topbar
        title="Document Upload"
        subtitle="Submit and review your required application documents"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <DocumentUpload
          schemeId={scheme.id}
          schemeName={scheme.name}
        />
      </main>
    </div>
  );
}