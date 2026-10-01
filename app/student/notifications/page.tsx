import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { NotificationsCenter } from '@/components/student/notifications/NotificationsCenter';
import { studentNavigation } from '@/lib/navigation';

export default function StudentNotificationsPage() {
  return (
    <div className="min-h-screen">
      <Topbar title="Notifications" subtitle="Stay updated about your applications, documents and important scholarship information" />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <NotificationsCenter />
      </main>
    </div>
  );
}