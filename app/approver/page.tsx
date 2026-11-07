import { ApprovalQueueClient } from "@/components/admin/applications/ApprovalQueueClient";
import { prisma } from "@/lib/prisma";
import { assertDatabaseUrlConfigured } from "@/lib/prisma";
import { ApplicationStatus, AiVerificationStatus, ManualReviewStatus, SelectionOutcome } from "@/lib/generated/prisma/client";

export const metadata = { title: "Approval Queue | FellowShift" };

export default async function ApproverPage() {
  assertDatabaseUrlConfigured();
  const candidates = await prisma.scholarshipApplication.findMany({
    where: {
      status: ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
      submittedAt: { not: null },
      aiVerificationStatus: AiVerificationStatus.ELIGIBLE,
      manualReviewStatus: ManualReviewStatus.VERIFIED,
      selectionDecisions: { some: { outcome: SelectionOutcome.SELECTED } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      applicationNumber: true,
      academicYear: true,
      student: { select: { user: { select: { fullName: true } } } },
      scheme: { select: { name: true } },
      selectionDecisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { outcome: true },
      },
      approvalDecisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
  });
  const applications = candidates.flatMap((application) => {
    const selection = application.selectionDecisions[0];
    const approval = application.approvalDecisions[0];
    if (
      selection?.outcome !== SelectionOutcome.SELECTED ||
      (approval?.status !== "PENDING_APPROVAL" && approval?.status !== "RETURNED_FOR_REVIEW")
    ) return [];
    return [{
      applicationNumber: application.applicationNumber,
      applicantName: application.student.user.fullName,
      schemeName: application.scheme.name,
      academicYear: application.academicYear,
      selectionOutcome: selection.outcome,
      approvalStatus: approval.status,
    }];
  });

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Separate approval queue</h1>
          <p className="mt-1 text-sm text-slate-600">Only users with the explicit APPROVER role can record these decisions. Approval does not initiate sanction or payment.</p>
        </header>
        <ApprovalQueueClient applications={applications} />
      </div>
    </main>
  );
}
