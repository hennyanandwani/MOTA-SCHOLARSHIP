import { AnalyticsPageClient } from '@/components/admin/analytics/AnalyticsPageClient';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import {
  getAdminApplications,
  getAdminSchemeSummaries,
  getAdminWorkflowStages,
  getGeographicDistribution,
  getRecentAdminActivity,
} from '@/lib/adminData';
import { getInitialDeficiencyRecords } from '@/lib/adminDeficiencyData';
import { createInitialScreeningCases } from '@/lib/adminScreeningData';
import { createInitialSelectionCases } from '@/lib/adminSelectionData';
import { adminNavigation } from '@/lib/navigation';
import { schemes } from '@/lib/schemes';
import { getInitialVerificationRecords } from '@/lib/adminVerificationData';

export const metadata = {
  title: 'Analytics & Reports | MoTA Administration',
  description: 'Illustrative scholarship application, workflow, verification and scheme analytics.',
};

export default function AdminAnalyticsPage() {
  const applications = getAdminApplications();
  const schemeSummaries = getAdminSchemeSummaries();

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Analytics & Reports"
        subtitle="Scholarship workflow performance and reporting"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <AnalyticsPageClient
            applications={applications}
            schemes={schemes}
            schemeSummaries={schemeSummaries}
            verifications={getInitialVerificationRecords()}
            deficiencies={getInitialDeficiencyRecords()}
            screeningCases={createInitialScreeningCases(applications)}
            selectionCases={createInitialSelectionCases(applications, schemeSummaries)}
            workflowStages={getAdminWorkflowStages()}
            geographicData={getGeographicDistribution()}
            activity={getRecentAdminActivity()}
          />
        </div>
      </main>
    </div>
  );
}
