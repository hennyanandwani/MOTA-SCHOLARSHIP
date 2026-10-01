import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CentralDocuments } from '@/components/student/documents/CentralDocuments';
import { studentNavigation } from '@/lib/navigation';

export default function StudentDocumentsPage() {
  return (
    <div className="min-h-screen">
      <Topbar title="Documents" subtitle="Manage your uploaded documents and review their verification status" />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <CentralDocuments />
      </main>
    </div>
  );
}