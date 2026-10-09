import type { AdminApplicationRecord, AdminSchemeSummary } from '@/lib/adminData';

export type MeritFactor = {
  id: string;
  label: string;
  score: number;
  maximum: number;
  basis: string;
};

export type SelectionStatus =
  | 'Recommended'
  | 'Selected'
  | 'Waitlisted'
  | 'Not Recommended';

export type SelectionApprovalStatus =
  | 'Pending Approval'
  | 'Approved'
  | 'Returned for Review';

export type SanctionStatus = 'Not Started' | 'Sanction Ready' | 'Submitted' | 'Sanctioned';
export type SelectionPriority = 'High' | 'Medium' | 'Low';

export type SelectionActivity = {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  actor: string;
  isDemo: boolean;
};

export type SelectionNote = {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  note: string;
};

export type SelectionCaseState = {
  selectionStatus: SelectionStatus;
  approvalStatus: SelectionApprovalStatus;
  sanctionStatus: SanctionStatus;
  reviewNotes: SelectionNote[];
  activities: SelectionActivity[];
  updatedAt: string;
};

export type SelectionCase = {
  application: AdminApplicationRecord;
  rank: number;
  priority: SelectionPriority;
  meritFactors: MeritFactor[];
  totalMeritScore: number;
  recommendation: string;
  quotaName: string;
  quotaCapacity: number;
  selectionStatus: SelectionStatus;
  approvalStatus: SelectionApprovalStatus;
  sanctionStatus: SanctionStatus;
  reviewNotes: SelectionNote[];
  activities: SelectionActivity[];
  updatedAt: string;
};

export type StoredSelectionState = Record<string, SelectionCaseState>;

export const SELECTION_STORAGE_KEY = 'mota_admin_selection_state';

const meritFactorDefinitions = [
  { id: 'academic', label: 'Academic performance', maximum: 40, basis: 'Illustrative marks profile for demo' },
  { id: 'economic', label: 'Income / economic criteria', maximum: 20, basis: 'Illustrative economic-need profile for demo' },
  { id: 'scheme', label: 'Scheme-specific merit', maximum: 20, basis: 'Illustrative course and scheme alignment' },
  { id: 'category', label: 'Category / quota consideration', maximum: 10, basis: 'Reserved-category consideration shown for demonstration' },
  { id: 'other', label: 'Other configured factors', maximum: 10, basis: 'Illustrative completeness and scrutiny factors' },
] as const;

function scoreFor(application: AdminApplicationRecord, factorIndex: number, maximum: number): number {
  const seed = [...application.applicationId].reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    application.familyIncome % 997,
  );
  const variation = (seed * (factorIndex + 5) + factorIndex * 17) % (maximum + 1);
  return factorIndex === 0 ? Math.max(20, variation) : variation;
}

function createMeritFactors(application: AdminApplicationRecord): MeritFactor[] {
  return meritFactorDefinitions.map((factor, index) => ({
    ...factor,
    score: scoreFor(application, index, factor.maximum),
  }));
}

function asActivity(
  application: AdminApplicationRecord,
  id: string,
  action: string,
  details: string,
): SelectionActivity {
  return {
    id: `${application.applicationId}-${id}`,
    timestamp: `${application.lastActionDate}T10:00:00`,
    action,
    details,
    actor: 'Selection Desk',
    isDemo: true,
  };
}

export function createInitialSelectionCases(
  applications: AdminApplicationRecord[],
  schemes: AdminSchemeSummary[],
): SelectionCase[] {
  const quotaByScheme = new Map(schemes.map((scheme) => [scheme.schemeId, scheme]));
  const eligibleApplications = applications.filter((application) =>
    (application.currentStage === 'Screening' || application.currentStage === 'Selection') &&
    application.verificationStatus === 'Verified' &&
    (application.status === 'Screened' || application.status === 'Selected'),
  );

  const ranked = eligibleApplications
    .map((application) => {
      const meritFactors = createMeritFactors(application);
      const totalMeritScore = meritFactors.reduce((total, factor) => total + factor.score, 0);
      const scheme = quotaByScheme.get(application.schemeId);
      const alreadySelected = application.status === 'Selected';
      const recommendation = alreadySelected
        ? 'Selection recorded'
        : totalMeritScore >= 68
          ? 'Preliminary recommendation'
          : 'Official review required';
      const selectionStatus: SelectionStatus = alreadySelected
        ? 'Selected'
        : totalMeritScore >= 68
          ? 'Recommended'
          : 'Waitlisted';
      const approvalStatus: SelectionApprovalStatus = alreadySelected
        ? 'Approved'
        : 'Pending Approval';
      const sanctionStatus: SanctionStatus = alreadySelected ? 'Sanction Ready' : 'Not Started';
      const activities = [
        asActivity(
          application,
          'entered-selection',
          'Entered merit ranking',
          'Screening is complete and the illustrative case is available for authorized selection review.',
        ),
        asActivity(
          application,
          'merit-calculated',
          'Merit factors calculated',
          `Illustrative factor total: ${totalMeritScore}/100. This ranking supports, but does not replace, official review.`,
        ),
      ];
      if (alreadySelected) {
        activities.push(asActivity(
          application,
          'demo-selection',
          'Selection status recorded (demo)',
          'Existing illustrative application status is selected; sanction readiness shown here is demonstration data.',
        ));
      }

      return {
        application,
        priority: application.riskScore,
        meritFactors,
        totalMeritScore,
        recommendation,
        quotaName: 'ST category allocation',
        quotaCapacity: scheme?.totalSlots ?? 0,
        selectionStatus,
        approvalStatus,
        sanctionStatus,
        reviewNotes: [],
        activities,
        updatedAt: `${application.lastActionDate}T10:00:00`,
      } satisfies Omit<SelectionCase, 'rank'>;
    })
    .sort((first, second) =>
      second.totalMeritScore - first.totalMeritScore ||
      first.application.submittedDate.localeCompare(second.application.submittedDate),
    );

  return ranked.map((selectionCase, index) => ({ ...selectionCase, rank: index + 1 }));
}

export function isStoredSelectionState(value: unknown): value is StoredSelectionState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((item) => {
    if (!item || typeof item !== 'object') return false;
    const state = item as Partial<SelectionCaseState>;
    return (
      (state.selectionStatus === 'Recommended' ||
        state.selectionStatus === 'Selected' ||
        state.selectionStatus === 'Waitlisted' ||
        state.selectionStatus === 'Not Recommended') &&
      (state.approvalStatus === 'Pending Approval' ||
        state.approvalStatus === 'Approved' ||
        state.approvalStatus === 'Returned for Review') &&
      (state.sanctionStatus === 'Not Started' ||
        state.sanctionStatus === 'Sanction Ready' ||
        state.sanctionStatus === 'Submitted' ||
        state.sanctionStatus === 'Sanctioned') &&
      Array.isArray(state.reviewNotes) &&
      state.reviewNotes.every((note) =>
        Boolean(note) &&
        typeof note.id === 'string' &&
        typeof note.timestamp === 'string' &&
        typeof note.author === 'string' &&
        typeof note.action === 'string' &&
        typeof note.note === 'string',
      ) &&
      Array.isArray(state.activities) &&
      state.activities.every((activity) =>
        Boolean(activity) &&
        typeof activity.id === 'string' &&
        typeof activity.timestamp === 'string' &&
        typeof activity.action === 'string' &&
        typeof activity.details === 'string' &&
        typeof activity.actor === 'string' &&
        typeof activity.isDemo === 'boolean',
      ) &&
      typeof state.updatedAt === 'string'
    );
  });
}

export function mergeSelectionState(
  selectionCases: SelectionCase[],
  savedState: StoredSelectionState,
): SelectionCase[] {
  return selectionCases.map((selectionCase) => {
    const saved = savedState[selectionCase.application.applicationId];
    return saved ? { ...selectionCase, ...saved } : selectionCase;
  });
}

export function toStoredSelectionState(selectionCases: SelectionCase[]): StoredSelectionState {
  return Object.fromEntries(
    selectionCases.map((selectionCase) => [
      selectionCase.application.applicationId,
      {
        selectionStatus: selectionCase.selectionStatus,
        approvalStatus: selectionCase.approvalStatus,
        sanctionStatus: selectionCase.sanctionStatus,
        reviewNotes: selectionCase.reviewNotes,
        activities: selectionCase.activities,
        updatedAt: selectionCase.updatedAt,
      },
    ]),
  );
}
