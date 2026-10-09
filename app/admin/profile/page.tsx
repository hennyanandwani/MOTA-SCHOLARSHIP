import { AdminProfileClient } from '@/components/admin/profile/AdminProfileClient';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { getAdminApplications } from '@/lib/adminData';
import { createInitialRules } from '@/lib/adminRuleData';
import { adminNavigation } from '@/lib/navigation';
import { schemes } from '@/lib/schemes';

export const metadata = {
  title: 'Administrator Profile | MoTA Administration',
  description: 'Manage illustrative Ministry administrator profile details and local prototype preferences.',
};

export default function AdminProfilePage() {
  const applications = getAdminApplications();

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Administrator Profile"
        subtitle="Administrator account information and profile preferences"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1400px]">
          <AdminProfileClient
            applications={applications}
            schemes={schemes.map(({ id, name }) => ({ id, name }))}
            rules={createInitialRules(schemes)}
          />
        </div>
      </main>
    </div>
  );
}
