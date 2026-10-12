import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ApplicationManager } from '@/components/student/applications/ApplicationManager';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { studentNavigation } from '@/lib/navigation';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function StudentApplicationsPage() {
  const user = await getCurrentAppUser();
  if (!user || !user.student || user.role === 'ADMIN') redirect('/login');

  return (
    <div className="min-h-screen">
      <Topbar
        title="My Applications"
        subtitle="Track your scholarship and fellowship applications"
        userName={user.fullName}
        avatarInitials={getInitials(user.fullName)}
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1440px]">
          <ApplicationManager />
        </div>
      </main>
    </div>
  );
}