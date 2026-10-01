import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ApplicationManager } from '@/components/student/applications/ApplicationManager';
import { studentNavigation } from '@/lib/navigation';

export default function StudentApplicationsPage() {
  return (
    <div className="min-h-screen">
      <Topbar
        title="My Applications"
        subtitle="Track your scholarship and fellowship applications"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1440px]">
          <ApplicationManager />
          <p className="mt-6 border-t border-[#DCE3EC] pt-4 text-[11px] leading-5 text-[#64748B]">
            Application information shown is illustrative sample data for the portal preview.
          </p>
        </div>
      </main>
    </div>
  );
}