import { AdminHelpClient } from '@/components/admin/help/AdminHelpClient';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { getAdminApplications } from '@/lib/adminData';
import { adminNavigation } from '@/lib/navigation';

export const metadata = {
  title: 'Help & Support | MoTA Administration',
  description: 'Guidance, module documentation, troubleshooting, and demo support resources for Ministry administrators.',
};

export default function AdminHelpPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Help & Support"
        subtitle="Guidance and support resources for Ministry administrators"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1440px]">
          <AdminHelpClient applications={getAdminApplications()} />
        </div>
      </main>
    </div>
  );
}
