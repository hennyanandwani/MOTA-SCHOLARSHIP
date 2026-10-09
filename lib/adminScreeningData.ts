import type { AdminApplicationRecord } from '@/lib/adminData';

export type CriterionResult = 'Matched' | 'Failed' | 'Missing' | 'Needs Review';
export type ScreeningStatus =
  | 'Preliminary Match'
  | 'Criteria Not Met'
  | 'Missing Information'
  | 'Borderline / Exception'
  | 'Pending Official Review'
  | 'Reviewed';
export type OfficialReviewStatus =
  | 'Pending'
  | 'Reviewed'
  | 'Clarification Requested'
  | 'Exception Review'
  | 'Referred for Verification';
export type ScreeningPriority = 'High' | 'Medium' | 'Low';

export type EligibilityCriterion = {
  id: string;
  name: string;
  requirement: string;
  applicantValue: string;
  result: CriterionResult;
  evidence: string;
};

export type ScreeningActivity = {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  actor: string;
  isDemo: boolean;
};

export type ScreeningNote = {
  id: string;
  timestamp: string;
  author: string;
  note: string;
  action: string;
};

export type ClarificationRequest = {
  id: string;
  timestamp: string;
  note: string;
  requestedBy: string;
};

export type ScreeningCaseState = {
  screeningStatus: ScreeningStatus;
  officialReviewStatus: OfficialReviewStatus;
  reviewNotes: ScreeningNote[];
  isFlagged: boolean;
  clarificationRequests: ClarificationRequest[];
  activities: ScreeningActivity[];
  updatedAt: string;
};

export type ScreeningCase = {
  application: AdminApplicationRecord;
  priority: ScreeningPriority;
  criteria: EligibilityCriterion[];
  screeningStatus: ScreeningStatus;
  officialReviewStatus: OfficialReviewStatus;
  reviewNotes: ScreeningNote[];
  isFlagged: boolean;
  clarificationRequests: ClarificationRequest[];
  activities: ScreeningActivity[];
  updatedAt: string;
};

export type StoredScreeningState = Record<string, ScreeningCaseState>;

export const SCREENING_STORAGE_KEY = 'mota_admin_screening_state';

const demoProfiles: Record<string, { age: number; academicPercentage: number }> = {
  'NFST-2026-00125': { age: 27, academicPercentage: 68.4 },
  'NOS-2026-00421': { age: 24, academicPercentage: 59.2 },
  'NFST-2026-00781': { age: 29, academicPercentage: 74.6 },
  'NFST-2026-01450': { age: 31, academicPercentage: 81.2 },
  'PMS-2026-06230': { age: 19, academicPercentage: 72.8 },
  'NOS-2026-00840': { age: 25, academicPercentage: 66.1 },
  'TRF-2026-00388': { age: 28, academicPercentage: 77.5 },
  'PMS-2026-01044': { age: 20, academicPercentage: 63.7 },
  'PMS-2026-01582': { age: 22, academicPercentage: 58.8 },
  'NFST-2026-00349': { age: 30, academicPercentage: 69.3 },
};

function evaluateCriteria(application: AdminApplicationRecord): EligibilityCriterion[] {
  const profile = demoProfiles[application.applicationId] ?? (() => {
    const idValue = [...application.applicationId].reduce((total, character) => total + character.charCodeAt(0), 0);
    return {
      age: 18 + (idValue % 18),
      academicPercentage: 55 + (idValue % 44),
    };
  })();
  const incomeLimit = application.schemeId === 'national-overseas-st' ? 600000 : 250000;
  const incomeNearLimit = application.familyIncome >= incomeLimit * 0.95;
  const incomeResult: CriterionResult =
    application.familyIncome > incomeLimit
      ? 'Failed'
      : incomeNearLimit
        ? 'Needs Review'
        : 'Matched';
  const documentsResult: CriterionResult =
    (application.pendingDocsCount ?? 0) > 0
      ? 'Missing'
      : (application.flaggedDocsCount ?? 0) > 0
        ? 'Needs Review'
        : 'Matched';
  const institutionResult: CriterionResult =
    application.verificationStatus === 'Verified' ? 'Matched' : 'Needs Review';

  return [
    {
      id: 'age',
      name: 'Age',
      requirement: 'Age band configured for this scheme (illustrative demo rule)',
      applicantValue: `${profile.age} years`,
      result: profile.age >= 18 && profile.age <= 35 ? 'Matched' : 'Failed',
      evidence: 'Illustrative screening profile (demo only)',
    },
    {
      id: 'category',
      name: 'ST / category requirement',
      requirement: 'Scheduled Tribe category recorded for the application',
      applicantValue: `${application.category} — Scheduled Tribe`,
      result: application.category === 'ST' ? 'Matched' : 'Failed',
      evidence: 'Application category; certificate review remains a separate step',
    },
    {
      id: 'income',
      name: 'Family income',
      requirement: `At or below ₹${incomeLimit.toLocaleString('en-IN')} (illustrative demo ceiling)`,
      applicantValue: `₹${application.familyIncome.toLocaleString('en-IN')} per year`,
      result: incomeResult,
      evidence: 'Income value in application registry; verify against supporting certificate',
    },
    {
      id: 'academic',
      name: 'Academic percentage / qualification',
      requirement: 'Minimum 60% in qualifying study (illustrative demo rule)',
      applicantValue: `${profile.academicPercentage}% · ${application.academicLevel ?? application.course}`,
      result: profile.academicPercentage >= 60 ? 'Matched' : 'Failed',
      evidence: 'Illustrative screening profile (demo only); marksheet verification required',
    },
    {
      id: 'institution',
      name: 'Institution / course',
      requirement: 'Course and institution require scheme-specific verification',
      applicantValue: `${application.course} · ${application.institutionName}`,
      result: institutionResult,
      evidence: application.verificationStatus === 'Verified'
        ? 'Institution and course recorded; registry verification status is verified'
        : `Registry verification status: ${application.verificationStatus}`,
    },
    {
      id: 'documents',
      name: 'Required certificate / documents',
      requirement: 'Required documents present and reviewed for the scheme',
      applicantValue: `${application.verifiedDocsCount ?? 0} verified · ${application.pendingDocsCount ?? 0} pending · ${application.flaggedDocsCount ?? 0} flagged`,
      result: documentsResult,
      evidence: 'Document counts from the application registry; refer discrepancies to Verification',
    },
    {
      id: 'scheme',
      name: 'Scheme-specific criteria',
      requirement: `Requirements for ${application.schemeName} (illustrative scheme profile)`,
      applicantValue: `${application.academicYear} · ${application.academicLevel ?? application.course}`,
      result: application.schemeId && application.academicYear ? 'Matched' : 'Missing',
      evidence: `Scheme record: ${application.schemeId}`,
    },
  ];
}

function initialScreeningStatus(criteria: EligibilityCriterion[]): ScreeningStatus {
  if (criteria.some((criterion) => criterion.result === 'Failed')) return 'Criteria Not Met';
  if (criteria.some((criterion) => criterion.result === 'Missing')) return 'Missing Information';
  if (criteria.some((criterion) => criterion.result === 'Needs Review')) return 'Borderline / Exception';
  return 'Preliminary Match';
}

export function createInitialScreeningCases(
  applications: AdminApplicationRecord[],
): ScreeningCase[] {
  return applications.map((application) => {
    const criteria = evaluateCriteria(application);
    const flagged = criteria.some((criterion) => criterion.result === 'Needs Review');
    const startedAt = `${application.submittedDate}T09:00:00`;
    const activities: ScreeningActivity[] = [
      {
        id: `${application.applicationId}-started`,
        timestamp: startedAt,
        action: 'Screening started',
        details: 'Application entered the illustrative eligibility and scrutiny queue.',
        actor: 'Screening Engine',
        isDemo: true,
      },
      {
        id: `${application.applicationId}-evaluated`,
        timestamp: `${application.submittedDate}T09:02:00`,
        action: 'Criteria evaluated',
        details: `${criteria.filter((criterion) => criterion.result === 'Matched').length} criteria matched; review the evidence before taking action.`,
        actor: 'Screening Engine',
        isDemo: true,
      },
      ...(flagged
        ? [{
            id: `${application.applicationId}-flagged`,
            timestamp: `${application.submittedDate}T09:03:00`,
            action: 'Issue flagged',
            details: 'One or more criteria need official scrutiny; no eligibility decision was made.',
            actor: 'Screening Engine',
            isDemo: true,
          }]
        : []),
    ];

    return {
      application,
      priority: application.riskScore,
      criteria,
      screeningStatus: initialScreeningStatus(criteria),
      officialReviewStatus: 'Pending',
      reviewNotes: [],
      isFlagged: flagged || application.riskScore === 'High',
      clarificationRequests: [],
      activities,
      updatedAt: `${application.submittedDate}T09:03:00`,
    };
  });
}

export function isStoredScreeningState(value: unknown): value is StoredScreeningState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((item) => {
    if (!item || typeof item !== 'object') return false;
    const state = item as Partial<ScreeningCaseState>;
    return (
      typeof state.screeningStatus === 'string' &&
      typeof state.officialReviewStatus === 'string' &&
      Array.isArray(state.reviewNotes) &&
      typeof state.isFlagged === 'boolean' &&
      Array.isArray(state.clarificationRequests) &&
      Array.isArray(state.activities) &&
      typeof state.updatedAt === 'string'
    );
  });
}

export function mergeScreeningState(
  screeningCases: ScreeningCase[],
  savedState: StoredScreeningState,
): ScreeningCase[] {
  return screeningCases.map((screeningCase) => {
    const saved = savedState[screeningCase.application.applicationId];
    return saved ? { ...screeningCase, ...saved } : screeningCase;
  });
}

export function toStoredScreeningState(screeningCases: ScreeningCase[]): StoredScreeningState {
  return Object.fromEntries(
    screeningCases.map((screeningCase) => [
      screeningCase.application.applicationId,
      {
        screeningStatus: screeningCase.screeningStatus,
        officialReviewStatus: screeningCase.officialReviewStatus,
        reviewNotes: screeningCase.reviewNotes,
        isFlagged: screeningCase.isFlagged,
        clarificationRequests: screeningCase.clarificationRequests,
        activities: screeningCase.activities,
        updatedAt: screeningCase.updatedAt,
      },
    ]),
  );
}
