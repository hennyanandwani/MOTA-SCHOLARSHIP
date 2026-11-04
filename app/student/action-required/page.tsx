import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import {
  applicationDocumentLabels,
  requiredApplicationDocumentTypes,
} from '@/lib/applicationRequirements';
import { studentNavigation } from '@/lib/navigation';
import { prisma } from '@/lib/prisma';

export default async function StudentActionRequiredPage() {
  const user = await getCurrentAppUser();
  if (!user || !user.student || user.role !== 'STUDENT') redirect('/login');

  const drafts = await prisma.scholarshipApplication.findMany({
    where: { studentId: user.student.id, status: 'DRAFT' },
    select: {
      id: true,
      schemeId: true,
      scheme: { select: { name: true } },
      documents: {
        select: {
          type: true,
          verificationStatus: true,
          verificationRemarks: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const actions = drafts.flatMap((application) => {
    const actionsForDraft: {
      type: string;
      title: string;
      detail: string;
    }[] = [];

    for (const documentType of requiredApplicationDocumentTypes) {
      const document = application.documents.find(({ type }) => type === documentType);
      const name = applicationDocumentLabels[documentType] ?? documentType;
      if (!document) {
        actionsForDraft.push({
          type: documentType,
          title: `${name} is missing`,
          detail: `Upload the required ${name.toLowerCase()} to this draft.`,
        });
      } else if (
        document.verificationStatus === 'FLAGGED' ||
        document.verificationStatus === 'REJECTED'
      ) {
        actionsForDraft.push({
          type: documentType,
          title: `${name} needs attention`,
          detail: document.verificationRemarks ?? 'Review the saved document status.',
        });
      }
    }

    return actionsForDraft.map((action) => ({
      ...action,
      key: `${application.id}:${action.type}`,
      schemeName: application.scheme.name,
      href: `/student/schemes/${encodeURIComponent(application.schemeId)}/apply/documents`,
    }));
  });

  return (
    <div className="min-h-screen">
      <Topbar title="Action Required" subtitle="Review document items recorded for your draft applications" userName={user.fullName} />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1000px] space-y-5">
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-7">
            <h1 className="text-xl font-bold text-[#172033]">Draft application documents</h1>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Items below are derived from saved draft document metadata. This page does not represent a separate official decision or action history.
            </p>
          </section>
          {actions.length > 0 ? (
            <ul className="space-y-3">
              {actions.map((action) => (
                <li key={action.key} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#94600D]" aria-hidden="true" />
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-[#172033]">{action.title}</h2>
                      <p className="mt-1 text-xs leading-5 text-[#64748B]">{action.schemeName} · {action.detail}</p>
                    </div>
                  </div>
                  <Link href={action.href} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] px-3 text-xs font-semibold text-[#173F7A] hover:bg-blue-50">
                    Review draft documents <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <section className="flex flex-col items-center rounded-xl border border-dashed border-[#B8C9DC] bg-white px-5 py-10 text-center">
              <CheckCircle2 size={24} className="text-[#16805B]" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-semibold text-[#172033]">No document actions recorded for your drafts</h2>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">Missing required documents will appear here after you save a draft. Submitted application actions are not represented by this page.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
