import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ProfilePageClient } from '@/components/student/profile/ProfilePageClient';
import { studentNavigation } from '@/lib/navigation';

export default function StudentProfilePage() {
  return (
    <div className="min-h-screen">
      <Topbar title="My Profile" subtitle="Manage your personal, academic and application-related information" />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <ProfilePageClient />
      </main>
    </div>
  );
}