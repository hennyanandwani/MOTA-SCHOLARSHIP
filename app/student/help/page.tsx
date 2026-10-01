import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { HelpPageClient } from '@/components/student/help/HelpPageClient';
import { studentNavigation } from '@/lib/navigation';

export default function StudentHelpPage() {
  return (
    <div className="min-h-screen">
      <Topbar
        title="Help & Support"
        subtitle="Find answers, understand the application process, and get help with scholarship and fellowship services"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <HelpPageClient />
      </main>
    </div>
  );
}