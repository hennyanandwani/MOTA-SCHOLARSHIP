import { notFound, redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ApplicationWizard } from '@/components/student/application/ApplicationWizard';
import { studentNavigation } from '@/lib/navigation';
import { getSchemeWorkflowInfo } from '@/lib/persistedScholarshipScheme';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { createApplicationProfilePrefill } from '@/lib/applicationDraft';

export default async function ScholarshipApplicationPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;
  const user = await getCurrentAppUser();
  if (!user || !user.student || user.role !== 'STUDENT') redirect('/login');

  const scheme = await getSchemeWorkflowInfo(schemeId);

  if (!scheme) notFound();
  const initialData = createApplicationProfilePrefill({
    fullName: user.fullName,
    email: user.email,
    courseName: user.student.courseName,
    instituteName: user.student.instituteName,
    annualIncome: user.student.annualIncome,
    academicPercentage: user.student.academicPercentage,
  });

  return (
    <div className="min-h-screen">
      <Topbar
        title="Scholarship Application"
        subtitle="Complete your scheme application in a few steps"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <ApplicationWizard scheme={scheme} initialData={initialData} />
      </main>
    </div>
  );
}