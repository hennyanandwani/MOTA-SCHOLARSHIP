import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsPageClient } from '@/components/student/settings/SettingsPageClient';
import { studentNavigation } from '@/lib/navigation';

export default function StudentSettingsPage() {
  return (
    <div className="min-h-screen">
      <Topbar title="Settings" subtitle="Manage your account preferences and portal experience" />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <SettingsPageClient />
      </main>
    </div>
  );
}