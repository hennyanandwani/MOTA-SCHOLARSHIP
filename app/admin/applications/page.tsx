import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { adminNavigation } from '@/lib/navigation';
import { getAdminApplicationSummaries } from '@/lib/adminApplicationData';
import { ApplicationsPageClient } from '@/components/admin/applications/ApplicationsPageClient';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Application Registry | MoTA Administration',
  description: 'Search, review, and manage scholarship and fellowship applications under the Ministry of Tribal Affairs.',
};

export default async function AdminApplicationsPage() {
  const applications = await getAdminApplicationSummaries();
  const count = (status: string) => applications.filter((application) => application.status === status).length;
  const metrics = {
    totalApplications: applications.length,
    underReview: count('PENDING_VERIFICATION') + count('FLAGGED_FOR_MANUAL_REVIEW') + count('RECOMMENDED_FOR_APPROVAL'),
    verificationPending: applications.reduce((total, application) => total + (application.pendingDocsCount ?? 0), 0),
    deficiencies: applications.reduce((total, application) => total + (application.flaggedDocsCount ?? 0), 0),
    selected: count('APPROVED_BY_OFFICER'),
    pendingActions: count('SUBMITTED') + count('PENDING_VERIFICATION') + count('FLAGGED_FOR_MANUAL_REVIEW'),
    sanctionedAmount: 'Not tracked',
    avgProcessingDays: 0,
    slaComplianceRate: 0,
  };

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

          <footer className="mt-8 border-t border-[#DCE3EC] pt-4">
            <div className="flex flex-col gap-2 rounded-lg border border-[#DCE3EC] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#64748B]">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#173F7A] shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-[#172033]">Live application records:</strong>{' '}
                  status and document indicators are loaded from the portal database. AI results are shown only when persisted.
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