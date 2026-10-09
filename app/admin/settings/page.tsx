import { AdminSettingsClient } from '@/components/admin/settings/AdminSettingsClient';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { getAdminApplications } from '@/lib/adminData';
import { createInitialRules } from '@/lib/adminRuleData';
import { adminNavigation } from '@/lib/navigation';
import { schemes } from '@/lib/schemes';

export const metadata = {
  title: 'Settings | MoTA Administration',
  description: 'Configure administrator preferences and illustrative prototype settings.',
};

export default function AdminSettingsPage() {
  const applications = getAdminApplications();

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Settings"
        subtitle="Administrator preferences and prototype configuration"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          <AdminSettingsClient
            applications={applications}
            schemes={schemes.map(({ id, name }) => ({ id, name }))}
            rules={createInitialRules(schemes)}
          />
        </div>
      </main>
    </div>
  );
}
