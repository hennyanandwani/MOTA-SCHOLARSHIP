import Link from 'next/link';
import { AlertTriangle, CheckCircle2, FileSearch, ShieldCheck } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { adminNavigation } from '@/lib/navigation';
import { getAdminApplicationSummaries } from '@/lib/adminApplicationData';
import {
  isAiOutcomeAvailableForManualReview,
  isApplicationSubmitted,
} from '@/lib/adminWorkflow';

export const metadata = {
  title: 'Document Verification | MoTA Administration',
  description: 'Review persisted application document verification statuses.',
};

export default async function AdminVerificationPage() {
  let applications: Awaited<ReturnType<typeof getAdminApplicationSummaries>> = [];
  let loadError = false;
  try {
    applications = await getAdminApplicationSummaries();
  } catch (error) {
    loadError = true;
    console.error(
      'Admin verification queue failed to load:',
      error instanceof Error ? error.name : 'Unknown error',
    );
  }

  const queue = applications.filter((application) =>
    isApplicationSubmitted(application.status, application.submittedAt) &&
    isAiOutcomeAvailableForManualReview(
      application.aiVerificationStatus ?? '',
      application.aiAttemptCount ?? 0,
    ) &&
    ['PENDING', 'IN_PROGRESS', 'NEEDS_ATTENTION'].includes(
      application.manualReviewStatus ?? '',
    ) &&
    application.status !== 'APPROVED_BY_OFFICER' &&
    application.status !== 'REJECTED_BY_OFFICER',
  );
  const pendingCount = queue.reduce((total, application) => total + (application.pendingDocsCount ?? 0), 0);
  const flaggedCount = queue.reduce((total, application) => total + (application.flaggedDocsCount ?? 0), 0);
  const manualQueueIds = new Set(queue.map((application) => application.applicationId));
  const exceptions = applications.filter((application) =>
    !manualQueueIds.has(application.applicationId) &&
    (application.aiVerificationStatus === 'INELIGIBLE' &&
      !isAiOutcomeAvailableForManualReview(
        application.aiVerificationStatus,
        application.aiAttemptCount ?? 0,
      )) ||
    application.aiVerificationStatus === 'FAILED' ||
    application.aiVerificationStatus === 'NEEDS_ATTENTION' ||
    application.aiVerificationStatus === 'WAITING_FOR_CONFIGURATION' ||
    application.aiVerificationStatus === 'QUEUED' ||
    application.aiVerificationStatus === 'IN_PROGRESS',
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar title="Document Verification" subtitle="Review persisted application documents" role="MoTA Administration" context="admin" />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2563A8]">Administration / Verification</p>
            <h1 className="mt-1 text-2xl font-bold text-[#172033]">Document verification queue</h1>
            <p className="mt-1 text-sm text-[#64748B]">Only submitted applications and persisted document statuses are shown. Open an application to securely review documents and record verification.</p>
          </header>

          {loadError ? (
            <section role="alert" className="rounded-xl border border-rose-200 bg-white p-5 text-sm text-rose-800">
              Verification records could not be loaded. <Link href="/admin/verification" className="font-semibold underline">Try again</Link>
            </section>
          ) : (
            <>
              <section aria-label="Verification summary" className="grid gap-3 sm:grid-cols-3">
                <article className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                  <p className="text-xs text-[#64748B]">Applications needing review</p>
                  <p className="mt-1 text-2xl font-bold text-[#172033]">{queue.length}</p>
                </article>
                <article className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                  <p className="flex items-center gap-2 text-xs text-[#64748B]"><FileSearch size={14} /> Documents pending</p>
                  <p className="mt-1 text-2xl font-bold text-[#173F7A]">{pendingCount}</p>
                </article>
                <article className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                  <p className="flex items-center gap-2 text-xs text-[#64748B]"><AlertTriangle size={14} /> Flagged or rejected</p>
                  <p className="mt-1 text-2xl font-bold text-rose-700">{flaggedCount}</p>
                </article>
              </section>

              {queue.length === 0 ? (
                <section className="rounded-xl border border-[#DCE3EC] bg-white p-8 text-center">
                  <CheckCircle2 className="mx-auto text-emerald-700" size={24} aria-hidden="true" />
                  <h2 className="mt-3 font-semibold text-[#172033]">No persisted documents need review</h2>
                  <p className="mt-1 text-sm text-[#64748B]">Drafts are excluded. This queue does not generate verification results.</p>
                </section>
              ) : (
                <section className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                        <tr>
                          <th className="px-4 py-3">Application</th>
                          <th className="px-4 py-3">Applicant</th>
                          <th className="px-4 py-3">Scheme / year</th>
                          <th className="px-4 py-3">Pending</th>
                          <th className="px-4 py-3">Flagged / rejected</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Review</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF1F5]">
                        {queue.map((application) => (
                          <tr key={application.applicationId}>
                            <td className="px-4 py-3 font-mono text-xs">{application.applicationId}</td>
                            <td className="px-4 py-3">{application.applicantName}<span className="block text-xs text-[#64748B]">Roll: {application.rollNumber ?? 'Not provided'}</span></td>
                            <td className="px-4 py-3">{application.schemeName}<span className="block text-xs text-[#64748B]">{application.academicYear}</span></td>
                            <td className="px-4 py-3">{application.pendingDocsCount ?? 0}</td>
                            <td className="px-4 py-3">{application.flaggedDocsCount ?? 0}</td>
                            <td className="px-4 py-3">{application.status}</td>
                            <td className="px-4 py-3">
                              <Link className="inline-flex items-center gap-1 font-semibold text-[#173F7A] hover:underline" href={`/admin/applications?searchQuery=${encodeURIComponent(application.applicationId)}`}>
                                <ShieldCheck size={14} /> Open review
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              {exceptions.length > 0 && (
                <section aria-labelledby="ai-exceptions-heading" className="overflow-hidden rounded-xl border border-amber-200 bg-white">
                  <div className="border-b border-amber-100 bg-amber-50 p-4">
                    <h2 id="ai-exceptions-heading" className="font-semibold text-amber-950">AI outcomes and service exceptions</h2>
                    <p className="mt-1 text-xs text-amber-900">These records are not in the manual-verification queue. Failed or unavailable AI checks are not interpreted as ineligibility.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                        <tr>
                          <th className="px-4 py-3">Application</th>
                          <th className="px-4 py-3">Applicant</th>
                          <th className="px-4 py-3">AI state</th>
                          <th className="px-4 py-3">Application state</th>
                          <th className="px-4 py-3">Review</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF1F5]">
                        {exceptions.map((application) => (
                          <tr key={application.applicationId}>
                            <td className="px-4 py-3 font-mono text-xs">{application.applicationId}</td>
                            <td className="px-4 py-3">{application.applicantName}<span className="block text-xs text-[#64748B]">Roll: {application.rollNumber ?? 'Not provided'}</span></td>
                            <td className="px-4 py-3">{application.aiVerificationStatus}</td>
                            <td className="px-4 py-3">{application.status}</td>
                            <td className="px-4 py-3"><Link className="font-semibold text-[#173F7A] hover:underline" href={`/admin/applications?searchQuery=${encodeURIComponent(application.applicationId)}`}>Open record</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              {applications.length === 500 && <p className="text-xs text-[#64748B]">Showing the 500 most recently updated application records.</p>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
