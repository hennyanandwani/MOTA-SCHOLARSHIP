import { CommunicationsPageClient } from '@/components/admin/communications/CommunicationsPageClient';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { getAdminApplications } from '@/lib/adminData';
import { getInitialDeficiencyRecords } from '@/lib/adminDeficiencyData';
import { adminNavigation } from '@/lib/navigation';
import { schemes } from '@/lib/schemes';

export const metadata = {
  title: 'Communications | MoTA Administration',
  description: 'Manage illustrative scholarship notifications and applicant communications.',
};

export default function AdminCommunicationsPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Communications"
        subtitle="Manage Ministry and applicant communications"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <CommunicationsPageClient
            applications={getAdminApplications()}
            schemes={schemes}
            deficiencies={getInitialDeficiencyRecords()}
          />
        </div>
      </main>
    </div>
  );
}
