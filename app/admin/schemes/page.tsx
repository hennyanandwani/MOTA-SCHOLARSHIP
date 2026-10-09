import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SchemeAdministrationClient } from '@/components/admin/schemes/SchemeAdministrationClient';
import {
  getAdminSchemeSummaries,
} from '@/lib/adminData';
import { schemes } from '@/lib/schemes';
import { adminNavigation } from '@/lib/navigation';

export const metadata = {
  title: 'Scheme Administration | MoTA Administration',
  description: 'Manage illustrative scholarship and fellowship scheme configuration for the Ministry of Tribal Affairs.',
};

export default function AdminSchemesPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Scheme Administration"
        subtitle="Manage scholarship and fellowship scheme configuration"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <SchemeAdministrationClient
            schemes={schemes}
            summaries={getAdminSchemeSummaries()}
          />
        </div>
      </main>
    </div>
  );
}
