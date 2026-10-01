import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ActionRequiredPage } from '@/components/student/action-required/ActionRequiredPage';
import { studentNavigation } from '@/lib/navigation';

export default function StudentActionRequiredPage() {
  return (
    <div className="min-h-screen">
      <Topbar title="Action Required" subtitle="Review pending actions and complete application corrections" />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <ActionRequiredPage />
      </main>
    </div>
  );
}