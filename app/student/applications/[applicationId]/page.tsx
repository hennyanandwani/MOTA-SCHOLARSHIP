import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { getOwnedApplicationScope } from '@/lib/applicationConcurrency';
import { applicationDocumentLabels, requiredApplicationDocumentTypes } from '@/lib/applicationRequirements';
import { studentNavigation } from '@/lib/navigation';
import { prisma } from '@/lib/prisma';

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_VERIFICATION: 'Under review',
  FLAGGED_FOR_MANUAL_REVIEW: 'Manual review',
  RECOMMENDED_FOR_APPROVAL: 'Recommended for approval',
  APPROVED_BY_OFFICER: 'Approved',
  REJECTED_BY_OFFICER: 'Rejected',
};

function formatDate(value: Date | null): string {
  if (!value) return 'Not submitted';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export default async function ApplicationTrackingRoute({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const user = await getCurrentAppUser();
  if (!user || !user.student || user.role !== 'STUDENT') redirect('/login');

  const application = await prisma.scholarshipApplication.findFirst({
    where: getOwnedApplicationScope(applicationId, user.student.id),
    select: {
      id: true,
      applicationNumber: true,
      academicYear: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
      scheme: { select: { id: true, name: true, type: true } },
      documents: {
        select: { type: true, verificationStatus: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!application) notFound();

  const documentsByType = new Map(
    application.documents.map((document) => [document.type, document]),
  );
  const isDraft = application.status === 'DRAFT';

  return (
    <div className="min-h-screen">
      <Topbar
        title="Application Details"
        subtitle="Your persisted scholarship application status"
        userName={user.fullName}
      />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2563A8]">
                  {application.scheme.type === 'FELLOWSHIP' ? 'Fellowship' : 'Scholarship'}
                </p>
                <h1 className="mt-2 text-xl font-bold text-[#172033]">{application.scheme.name}</h1>
                <p className="mt-1 break-all text-xs text-[#64748B]">{application.applicationNumber}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1D5796]">
                {statusLabels[application.status] ?? application.status}
              </span>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-[#EEF1F5] pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#64748B]">Academic year</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">{application.academicYear}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Submitted</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">{formatDate(application.submittedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Last updated</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">{formatDate(application.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Status</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">
                  {isDraft ? 'Not submitted' : statusLabels[application.status] ?? application.status}
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="document-status-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-7">
            <h2 id="document-status-heading" className="text-base font-semibold text-[#172033]">Required documents</h2>
            <p className="mt-1 text-sm text-[#64748B]">Only saved document metadata is shown; private storage links are not exposed.</p>
            <ul className="mt-4 divide-y divide-[#EEF1F5]">
              {requiredApplicationDocumentTypes.map((type) => {
                const document = documentsByType.get(type);
                const documentStatus = !document
                  ? 'Missing'
                  : document.verificationStatus === 'VERIFIED'
                    ? 'Verified'
                    : document.verificationStatus === 'FLAGGED'
                      ? 'Needs attention'
                      : document.verificationStatus === 'REJECTED'
                        ? 'Rejected'
                        : 'Uploaded · pending verification';

                return (
                  <li key={type} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="text-[#334155]">{applicationDocumentLabels[type] ?? type}</span>
                    <span className="text-right font-medium text-[#475569]">{documentStatus}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <nav aria-label="Application actions" className="flex flex-wrap gap-3">
            {isDraft && (
              <Link href={`/student/schemes/${encodeURIComponent(application.scheme.id)}/apply`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white hover:bg-[#123362]">
                Continue draft
              </Link>
            )}
            <Link href="/student/applications" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] bg-white px-4 text-sm font-semibold text-[#334155]">
              Back to My Applications
            </Link>
            <Link href={`/student/schemes/${encodeURIComponent(application.scheme.id)}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] bg-white px-4 text-sm font-semibold text-[#334155]">
              View scheme details
            </Link>
          </nav>
          <p className="text-xs leading-5 text-[#64748B]">
            Workflow activity, selection details, and payment information are not available in the current application record.
          </p>
        </div>
      </main>
    </div>
  );
}
