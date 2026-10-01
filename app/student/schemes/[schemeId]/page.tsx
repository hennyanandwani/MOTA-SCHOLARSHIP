import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SchemeDetails } from '@/components/student/SchemeDetails';
import { getSchemeWithDetails } from '@/lib/schemeDetails';
import { studentNavigation } from '@/lib/navigation';

export default async function SchemeDetailsPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;
  const data = getSchemeWithDetails(schemeId);

  if (!data) notFound();

  return (
    <div className="min-h-screen">
      <Topbar
        title="Scheme Details"
        subtitle="Review scheme information and eligibility guidance"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <SchemeDetails data={data} />
      </main>
    </div>
  );
}