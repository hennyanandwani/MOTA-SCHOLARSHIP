import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ApplicationWizard } from '@/components/student/application/ApplicationWizard';
import { studentNavigation } from '@/lib/navigation';
import { getSchemeWithDetails } from '@/lib/schemeDetails';

export default async function ScholarshipApplicationPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;
  const schemeData = getSchemeWithDetails(schemeId);

  if (!schemeData) notFound();

  return (
    <div className="min-h-screen">
      <Topbar
        title="Scholarship Application"
        subtitle="Complete your scheme application in a few steps"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <ApplicationWizard scheme={schemeData.scheme} />
      </main>
    </div>
  );
}