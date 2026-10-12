import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CircleUserRound } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ActionRequired } from '@/components/student/ActionRequired';
import { ApplicationProgress } from '@/components/student/ApplicationProgress';
import { ApplicationsTable } from '@/components/student/ApplicationsTable';
import { DashboardStats } from '@/components/student/DashboardStats';
import { QuickActions } from '@/components/student/QuickActions';
import { RecommendedSchemes } from '@/components/student/RecommendedSchemes';
import type {
  DashboardAction,
  DashboardApplication,
  DashboardScheme,
} from '@/components/student/dashboardTypes';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { prisma } from '@/lib/prisma';
import { schemes as schemeCatalog } from '@/lib/schemes';
import { studentNavigation } from '@/lib/navigation';

function statusLabel(status: string): string {
  switch (status) {
    case 'DRAFT': return 'Draft';
    case 'SUBMITTED': return 'Submitted';
    case 'PENDING_VERIFICATION': return 'Under Review';
    case 'FLAGGED_FOR_MANUAL_REVIEW': return 'Manual Review';
    case 'RECOMMENDED_FOR_APPROVAL': return 'Recommended for approval';
    case 'APPROVED_BY_OFFICER': return 'Approved';
    case 'REJECTED_BY_OFFICER': return 'Rejected';
    default: return status;
  }
}

function currentStage(status: string): string {
  switch (status) {
    case 'DRAFT': return 'Draft in progress';
    case 'SUBMITTED': return 'Awaiting verification';
    case 'PENDING_VERIFICATION': return 'Verification in progress';
    case 'FLAGGED_FOR_MANUAL_REVIEW': return 'Manual review';
    case 'RECOMMENDED_FOR_APPROVAL': return 'Awaiting officer decision';
    case 'APPROVED_BY_OFFICER': return 'Approved';
    case 'REJECTED_BY_OFFICER': return 'Rejected';
    default: return status;
  }
}

function profileCompletion(user: {
  fullName: string;
  email: string;
  student: {
    rollNumber: string;
    subCaste: string | null;
    annualIncome: unknown;
    academicPercentage: unknown;
    courseName: string | null;
    instituteName: string | null;
  } | null;
}): number {
  const student = user.student;
  if (!student) return 0;
  const filled = [
    user.fullName,
    user.email,
    student.rollNumber,
    student.subCaste,
    student.annualIncome,
    student.academicPercentage,
    student.courseName,
    student.instituteName,
  ].filter((value) => value !== null && value !== undefined && String(value).trim() !== '').length;
  return Math.round((filled / 8) * 100);
}

function documentName(type: string): string {
  const names: Record<string, string> = {
    CASTE_CERTIFICATE: 'Caste certificate',
    INCOME_CERTIFICATE: 'Income certificate',
    MARKSHEET: 'Marksheet',
    IDENTITY_PROOF: 'Identity proof',
    ADMISSION_PROOF: 'Admission proof',
    BANK_PROOF: 'Bank proof',
    PHOTOGRAPH: 'Photograph',
    OTHER: 'Supporting document',
  };
  return names[type] ?? 'Document';
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function StudentDashboard() {
  const user = await getCurrentAppUser();
  if (!user) redirect('/login');
  if (user.role === 'ADMIN') redirect('/admin');
  if (!user.student) redirect('/login?error=profile_not_provisioned');

  let applications: DashboardApplication[] = [];
  let actions: DashboardAction[] = [];
  let recommendationSchemes: DashboardScheme[] = [];
  let totalApplications = 0;
  let underReviewCount = 0;
  let actionApplicationCount = 0;
  let dashboardError = false;

  try {
    const knownSchemeIds = schemeCatalog.map((scheme) => scheme.id);
    const [applicationRows, actionRows, dbTotal, dbUnderReview, dbActionCount, dbSchemes] = await Promise.all([
      prisma.scholarshipApplication.findMany({
        where: { studentId: user.student.id },
        orderBy: [{ updatedAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          applicationNumber: true,
          schemeId: true,
          status: true,
          submittedAt: true,
          createdAt: true,
          scheme: { select: { name: true } },
        },
      }),
      prisma.scholarshipApplication.findMany({
        where: {
          studentId: user.student.id,
          documents: { some: { verificationStatus: { in: ['FLAGGED', 'REJECTED'] } } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          applicationNumber: true,
          schemeId: true,
          scheme: { select: { name: true } },
          documents: {
            where: { verificationStatus: { in: ['FLAGGED', 'REJECTED'] } },
            select: {
              id: true,
              type: true,
              verificationStatus: true,
              verificationRemarks: true,
            },
          },
        },
      }),
      prisma.scholarshipApplication.count({
        where: { studentId: user.student.id },
      }),
      prisma.scholarshipApplication.count({
        where: {
          studentId: user.student.id,
          status: { in: ['PENDING_VERIFICATION', 'FLAGGED_FOR_MANUAL_REVIEW'] },
        },
      }),
      prisma.scholarshipApplication.count({
        where: {
          studentId: user.student.id,
          documents: { some: { verificationStatus: { in: ['FLAGGED', 'REJECTED'] } } },
        },
      }),
      prisma.scholarshipScheme.findMany({
        where: { isActive: true, id: { in: knownSchemeIds } },
        orderBy: { name: 'asc' },
        take: 3,
        select: { id: true, name: true, description: true, type: true },
      }),
    ]);

    applications = applicationRows.map((application) => ({
      id: application.id,
      schemeId: application.schemeId,
      schemeName: application.scheme.name,
      applicationNumber: application.applicationNumber,
      submittedAt: application.submittedAt?.toISOString() ?? null,
      status: application.status,
      statusLabel: statusLabel(application.status),
      currentStage: currentStage(application.status),
      applicationHref: `/student/schemes/${encodeURIComponent(application.schemeId)}/apply`,
      reviewHref: `/student/schemes/${encodeURIComponent(application.schemeId)}/apply/review`,
    }));
    actions = actionRows.flatMap((application) => application.documents.map((document) => ({
      id: document.id,
      applicationNumber: application.applicationNumber,
      schemeName: application.scheme.name,
      documentName: documentName(document.type),
      status: document.verificationStatus,
      remarks: document.verificationRemarks,
      href: `/student/schemes/${encodeURIComponent(application.schemeId)}/apply/review`,
    })));
    totalApplications = dbTotal;
    underReviewCount = dbUnderReview;
    actionApplicationCount = dbActionCount;
    recommendationSchemes = dbSchemes;
  } catch (error) {
    console.error('Unable to load student dashboard data:', error);
    dashboardError = true;
  }

  const completion = profileCompletion(user);
  const profileFieldsLabel = 'Based on saved basic profile fields';
  const progressApplication = applications[0] ?? null;

  return (
    <div className="min-h-screen">
      <Topbar
        title="Student Dashboard"
        subtitle="Scholarship and fellowship application overview"
        userName={user.fullName}
        avatarInitials={getInitials(user.fullName)}
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main id="dashboard" className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <section className="flex flex-col justify-between gap-5 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:flex-row sm:items-center sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2563A8]">Your student account</p>
              <h1 className="mt-2 text-2xl font-bold text-[#172033]">Welcome, {user.fullName}</h1>
              <p className="mt-1 text-sm text-[#64748B]">Here’s an overview of your scholarship and fellowship applications.</p>
            </div>

            <div id="profile" className="w-full rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:max-w-[285px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CircleUserRound size={17} className="text-[#2563A8]" aria-hidden="true" />
                  <p className="text-xs font-semibold text-[#334155]">Profile completion</p>
                </div>
                <span className="text-sm font-bold text-[#173F7A]">{completion}%</span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-[#E3EAF2]"
                role="progressbar"
                aria-label="Profile completion based on saved basic profile fields"
                aria-valuenow={completion}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full rounded-full bg-[#2563A8]" style={{ width: `${completion}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-[#64748B]">{profileFieldsLabel}</p>
              <Link href="/student/profile" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2563A8] hover:underline">
                Complete profile<ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </section>

          {dashboardError ? (
            <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-[#7F2931]">
              Dashboard data could not be loaded. Refresh the page to try again.
            </section>
          ) : (
            <>
              <DashboardStats
                applications={totalApplications}
                underReview={underReviewCount}
                actionRequired={actionApplicationCount}
              />

              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
                <div className="min-w-0 space-y-5">
                  <ActionRequired actions={actions} />
                  <ApplicationsTable applications={applications} />
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
                  <ApplicationProgress application={progressApplication} />
                  <QuickActions />
                </div>
              </div>

              <RecommendedSchemes schemes={recommendationSchemes} />
            </>
          )}

          <footer className="flex flex-col gap-1 border-t border-[#DCE3EC] pt-4 text-[11px] text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
            <p>Ministry of Tribal Affairs · Scholarship &amp; Fellowship Management System</p>
            <p>AI-assisted workflows · Human oversight</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
