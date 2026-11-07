import Link from 'next/link';
import { CheckCircle2, CircleAlert, FileCheck2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { adminNavigation } from '@/lib/navigation';
import { getAdminApplicationSummaries } from '@/lib/adminApplicationData';
import { isApplicationSubmitted } from '@/lib/adminWorkflow';
import { SelectionWorkflowClient } from '@/components/admin/applications/SelectionWorkflowClient';

export const metadata = {
  title: 'Selection Review | MoTA Administration',
  description: 'Review persisted recommendations and officer decisions.',
};

export default async function AdminSelectionPage() {
  let applications: Awaited<ReturnType<typeof getAdminApplicationSummaries>> = [];
  let loadError = false;
  try {
    applications = await getAdminApplicationSummaries();
  } catch (error) {
    loadError = true;
    console.error(
      'Admin selection queue failed to load:',
      error instanceof Error ? error.name : 'Unknown error',
    );
  }

  const submittedApplications = applications.filter((application) =>
    isApplicationSubmitted(application.status, application.submittedAt),
  );
  const recommendations = submittedApplications.filter(
    (application) =>
      application.status === 'RECOMMENDED_FOR_APPROVAL' &&
      application.aiVerificationStatus === 'ELIGIBLE' &&
      application.manualReviewStatus === 'VERIFIED',
  );
  const selectedCount = recommendations.filter(
    (application) => application.selectionOutcome === 'SELECTED',
  ).length;
  const waitlistedCount = recommendations.filter(
    (application) => application.selectionOutcome === 'WAITLISTED',
  ).length;
  const notRecommendedCount = recommendations.filter(
    (application) => application.selectionOutcome === 'NOT_RECOMMENDED',
  ).length;

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar title="Selection Review" subtitle="Persisted recommendations and officer decisions" role="MoTA Administration" context="admin" />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2563A8]">Administration / Selection</p>
            <h1 className="mt-1 text-2xl font-bold text-[#172033]">Recommendation and decision review</h1>
            <p className="mt-1 text-sm text-[#64748B]">This view uses only persisted application statuses. Recommendations are not final approvals.</p>
          </header>

          {loadError ? (
            <section role="alert" className="rounded-xl border border-rose-200 bg-white p-5 text-sm text-rose-800">
              Selection records could not be loaded. <Link href="/admin/selection" className="font-semibold underline">Try again</Link>
            </section>
          ) : (
            <>
              <section aria-label="Selection summary" className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                  <p className="flex items-center gap-2 text-xs text-[#64748B]"><CheckCircle2 size={14} /> Selected</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">{selectedCount}</p>
                </article>
                <article className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                  <p className="flex items-center gap-2 text-xs text-[#64748B]"><FileCheck2 size={14} /> Waitlisted</p>
                  <p className="mt-1 text-2xl font-bold text-[#173F7A]">{waitlistedCount}</p>
                </article>
                <article className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                  <p className="flex items-center gap-2 text-xs text-[#64748B]"><CircleAlert size={14} /> Not recommended</p>
                  <p className="mt-1 text-2xl font-bold text-rose-700">{notRecommendedCount}</p>
                </article>
              </section>

              <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                Selection outcomes and separate approval decisions are persisted. No priority, ranking, quota, sanction, or payment result is inferred; those policies remain out of scope.
              </aside>

              <SelectionWorkflowClient applications={recommendations} />
              {applications.length === 500 && <p className="text-xs text-[#64748B]">Showing the 500 most recently updated application records.</p>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
