import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { adminNavigation } from '@/lib/navigation';
import {
  getAdminApplications,
  getAdminDashboardMetrics,
  ADMIN_DEMO_NOTICE,
} from '@/lib/adminData';
import { ApplicationsPageClient } from '@/components/admin/applications/ApplicationsPageClient';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Application Registry | MoTA Administration',
  description: 'Search, review, and manage scholarship and fellowship applications under the Ministry of Tribal Affairs.',
};

export default function AdminApplicationsPage() {
  const applications = getAdminApplications();
  const metrics = getAdminDashboardMetrics();

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar role="MoTA Administration" context="admin" />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />

      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Interactive Registry Client */}
          <ApplicationsPageClient
            initialApplications={applications}
            metrics={metrics}
          />

          {/* Statutory Simulation Notice Banner */}
          <footer className="mt-8 border-t border-[#DCE3EC] pt-4">
            <div className="flex flex-col gap-2 rounded-lg border border-[#DCE3EC] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#64748B]">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#173F7A] shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-[#172033]">{ADMIN_DEMO_NOTICE.title}:</strong>{' '}
                  {ADMIN_DEMO_NOTICE.description}
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-600 shrink-0">
                SIH 2026 · PS 26239
              </span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}