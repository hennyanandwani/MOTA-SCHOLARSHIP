import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { EligibilityReview } from '@/components/student/EligibilityReview';
import { studentNavigation } from '@/lib/navigation';
import { getEligibilityReview } from '@/lib/eligibilityReview';

export default async function EligibilityCheckPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;
  const data = getEligibilityReview(schemeId);

  if (!data) notFound();

  return (
    <div className="min-h-screen">
      <Topbar
        title="Eligibility Check"
        subtitle="Review preliminary scheme criteria against your profile"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <EligibilityReview data={data} />
      </main>
    </div>
  );
}