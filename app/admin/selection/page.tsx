import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SelectionPageClient } from '@/components/admin/selection/SelectionPageClient';
import {
  getAdminApplications,
  getAdminSchemeSummaries,
} from '@/lib/adminData';
import { adminNavigation } from '@/lib/navigation';

export const metadata = {
  title: 'Selection & Sanction | MoTA Administration',
  description: 'Review merit-ranked scholarship applications and process illustrative selection and sanction decisions.',
};

export default function AdminSelectionPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Selection & Sanction"
        subtitle="Review merit-ranked applications and process selection decisions"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <SelectionPageClient
            applications={getAdminApplications()}
            schemes={getAdminSchemeSummaries()}
          />
        </div>
      </main>
    </div>
  );
}
