import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ApplicationStatusPage } from '@/components/student/application-status/ApplicationStatusPage';
import { studentNavigation } from '@/lib/navigation';
import { getTrackedApplication } from '@/lib/applicationTracking';

export default async function ApplicationTrackingRoute({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const application = getTrackedApplication(applicationId);

  if (!application) notFound();

  return (
    <div className="min-h-screen">
      <Topbar
        title="Application Status"
        subtitle="Track the progress of your scholarship or fellowship application"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <ApplicationStatusPage application={application} />
      </main>
    </div>
  );
}