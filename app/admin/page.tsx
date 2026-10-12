import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { adminNavigation } from '@/lib/navigation';
import { getAdminApplicationSummaries } from '@/lib/adminApplicationData';

export default async function AdminDashboard() {
  const applications = await getAdminApplicationSummaries();
  const count = (status: string) => applications.filter((application) => application.status === status).length;
  const stages = [
    { label: 'Submitted', count: count('SUBMITTED') },
    { label: 'Verification', count: count('PENDING_VERIFICATION') },
    { label: 'Manual review', count: count('FLAGGED_FOR_MANUAL_REVIEW') },
    { label: 'Recommended', count: count('RECOMMENDED_FOR_APPROVAL') },
    { label: 'Officer decided', count: count('APPROVED_BY_OFFICER') + count('REJECTED_BY_OFFICER') },
  ];
  const priorityApplications = applications.filter(
    (application) => application.status === 'FLAGGED_FOR_MANUAL_REVIEW' || (application.flaggedDocsCount ?? 0) > 0,
  );
  const stats = [
    ['Total applications', applications.length],
    ['Awaiting verification', count('SUBMITTED') + count('PENDING_VERIFICATION')],
    ['Flagged for manual review', count('FLAGGED_FOR_MANUAL_REVIEW')],
    ['Officer decisions', count('APPROVED_BY_OFFICER') + count('REJECTED_BY_OFFICER')],
  ];

  return (
    <div>
      <Topbar role="MoTA Administration" />
      <Sidebar items={adminNavigation} title="Administration" />
      <main className="min-w-0 p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-[#2563A8]">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Persisted application statuses and document indicators.</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
                <p className="text-xs font-medium text-[#64748B]">{label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-[#172033]">{Number(value).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
              <h2 className="font-semibold text-[#172033]">Application status pipeline</h2>
              <div className="mt-5 space-y-4">
                {stages.map(({ label, count: stageCount }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#64748B]">{label}</span>
                      <span className="font-semibold text-[#172033]">{stageCount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-[#2563A8]"
                        style={{ width: `${applications.length ? (stageCount / applications.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {applications.length === 0 && <p className="mt-4 text-xs text-slate-500">No applications are currently recorded.</p>}
            </section>
            <section className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
              <h2 className="font-semibold text-[#172033]">Applications needing review</h2>
              <div className="mt-4 space-y-3">
                {priorityApplications.slice(0, 5).map((application) => (
                  <div key={application.applicationId} className="rounded-lg border border-[#EEF1F5] bg-[#F8FAFC] p-4">
                    <p className="text-xs font-semibold text-[#172033]">{application.applicationId} · {application.applicantName}</p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {application.status === 'FLAGGED_FOR_MANUAL_REVIEW'
                        ? 'Persisted status: flagged for manual review'
                        : `${application.flaggedDocsCount ?? 0} persisted flagged or rejected document(s)`}
                    </p>
                    <Link
                      href={`/admin/applications?searchQuery=${encodeURIComponent(application.applicationId)}`}
                      className="mt-3 inline-block text-xs font-semibold text-[#173F7A] hover:underline"
                    >
                      Review application →
                    </Link>
                  </div>
                ))}
                {priorityApplications.length === 0 && (
                  <p className="rounded-lg bg-[#F8FAFC] p-4 text-xs text-[#64748B]">
                    No persisted manual-review status or flagged/rejected document indicators are recorded.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
