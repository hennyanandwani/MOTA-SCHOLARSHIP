import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ReviewApplication } from '@/components/student/review/ReviewApplication';
import { studentNavigation } from '@/lib/navigation';
import { getSchemeWithDetails } from '@/lib/schemeDetails';

export default async function ApplicationFinalReviewPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;
  const schemeData = getSchemeWithDetails(schemeId);

  if (!schemeData) notFound();

  return (
    <div className="min-h-screen">
      <Topbar title="Review & Submit" subtitle="Review your application before submission" />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <ReviewApplication
          schemeId={schemeData.scheme.id}
          schemeName={schemeData.scheme.name}
          schemeType={schemeData.scheme.type}
        />
      </main>
    </div>
  );
}