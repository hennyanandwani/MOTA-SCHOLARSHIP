import {
  AI_MAX_DOCUMENTS,
  type AiVerificationInput,
  type AiVerificationResult,
  AiVerificationAdapterError,
} from "@/lib/aiVerificationAdapterCore";
import {
  ELIGIBILITY_CRITERIA_FIELDS,
  SUPPORTED_POLICY_DOCUMENT_TYPES,
  type DeepReadonly,
  validateVerificationPolicyForPublication,
  type VerificationPolicySnapshot,
} from "@/lib/scholarshipVerificationPolicy";

const fieldPaths: Readonly<Record<string, string>> = {
  annual_income: "family.annualIncome",
  date_of_birth: "personal.dateOfBirth",
  gender: "personal.gender",
  category: "personal.category",
  state: "personal.state",
  district: "personal.district",
  academic_level: "academic.academicLevel",
  course: "academic.course",
  specialization: "academic.specialization",
  institution_name: "academic.institutionName",
  institution_type: "academic.institutionType",
  university_board: "academic.universityBoard",
  current_year_semester: "academic.currentYearSemester",
  admission_year: "academic.admissionYear",
  expected_graduation_year: "academic.expectedGraduationYear",
  family_members: "family.familyMembers",
  residential_status: "family.residentialStatus",
};

const supportedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const supportedDocumentTypes = new Set<string>(SUPPORTED_POLICY_DOCUMENT_TYPES);
const criterionFieldTypes = new Map(
  ELIGIBILITY_CRITERIA_FIELDS.map(({ field, valueType }) => [field, valueType]),
);

export type DispatchDocument = {
  id: string;
  type: string;
  mimeType: string;
  updatedAt?: Date | string;
};

export type DispatchCandidate = {
  jobId: string;
  applicationId: string;
  inputVersion: number;
  claimAttemptCount: number;
  applicationStatus: string;
  applicationInputVersion: number;
  applicationAiStatus: string;
  applicationSchemeId: string;
  idempotencyKey: string;
  policyId: string | null;
  policySnapshot: unknown;
  isSynthetic?: boolean;
  documentSnapshot?: unknown;
  applicationData: unknown;
  documents: readonly DispatchDocument[];
};

export type DispatchFailure = {
  code: string;
  ambiguous: boolean;
};

export function mapAiOutcomeToApplication(outcome: AiVerificationResult["outcome"], ineligibleCount: number) {
  const rejectionCount = ineligibleCount + (outcome === "INELIGIBLE" ? 1 : 0);
  const manualReviewRequired =
    outcome === "NEEDS_REVIEW" ||
    (outcome === "INELIGIBLE" && rejectionCount >= 4);
  return {
    rejectionCount,
    manualReviewRequired,
    aiVerificationStatus: outcome === "NEEDS_REVIEW"
      ? "NEEDS_ATTENTION"
      : outcome,
    aiEligibility: outcome === "ELIGIBLE"
      ? true
      : outcome === "INELIGIBLE"
        ? false
        : null,
    applicationStatus: manualReviewRequired
      ? "FLAGGED_FOR_MANUAL_REVIEW"
      : "SUBMITTED",
    manualReviewStatus: outcome === "ELIGIBLE" || manualReviewRequired
      ? "PENDING"
      : "NOT_READY",
    studentAiReason: outcome === "INELIGIBLE" && !manualReviewRequired
      ? "Please correct the application documents and resubmit for another AI verification."
      : null,
  } as const;
}

export function getProcessingClaimFence<TStatus extends string>(
  processingStatus: TStatus,
  attemptCount: number,
) {
  return { status: processingStatus, attemptCount };
}

export function getAbandonedClaimFence<TStatus extends string>(
  processingStatus: TStatus,
  attemptCount: number,
  cutoff: Date,
) {
  return {
    ...getProcessingClaimFence(processingStatus, attemptCount),
    updatedAt: { lt: cutoff },
  };
}

export function isCurrentProcessingClaim(
  candidate: Pick<DispatchCandidate, "claimAttemptCount">,
  current: { status: string; attemptCount: number },
): boolean {
  return (
    current.status === "PROCESSING" &&
    current.attemptCount === candidate.claimAttemptCount
  );
}

export type DispatchExecutionResult =
  | { kind: "completed"; outcome: AiVerificationResult["outcome"] }
  | { kind: "failed"; failure: DispatchFailure };

export class DispatchPreparationError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "DispatchPreparationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getDispatchCandidateStaleness(
  candidate: DispatchCandidate,
): string | null {
  if (candidate.applicationStatus !== "SUBMITTED") {
    return "APPLICATION_NOT_SUBMITTED";
  }
  if (candidate.applicationInputVersion !== candidate.inputVersion) {
    return "INPUT_VERSION_STALE";
  }
  if (candidate.applicationAiStatus !== "WAITING_FOR_CONFIGURATION") {
    return "APPLICATION_NOT_WAITING";
  }
  if (candidate.documentSnapshot != null) {
    const snapshot = parseDocumentSnapshot(candidate.documentSnapshot);
    if (!snapshot) return "DOCUMENT_SNAPSHOT_INVALID";
    const current = candidate.documents.map((document) => {
      const updatedAt = document.updatedAt instanceof Date
        ? document.updatedAt.toISOString()
        : document.updatedAt;
      return typeof updatedAt === "string"
        ? { id: document.id, type: document.type, updatedAt }
        : null;
    });
    const currentEntries = current.filter(
      (document): document is DocumentSnapshotEntry => document !== null,
    );
    if (
      currentEntries.length !== current.length ||
      !sameDocumentSnapshot(snapshot, currentEntries)
    ) {
      return "DOCUMENT_VERSION_STALE";
    }
  }
  return null;
}

export function isDispatchCandidateVersionCurrent(
  candidate: Pick<DispatchCandidate, "inputVersion" | "applicationInputVersion">,
): boolean {
  return candidate.inputVersion === candidate.applicationInputVersion;
}

export type DocumentSnapshotEntry = {
  id: string;
  type: string;
  updatedAt: string;
};

function parseDocumentSnapshot(value: unknown): DocumentSnapshotEntry[] | null {
  if (!Array.isArray(value)) return null;
  const entries: DocumentSnapshotEntry[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      !item.id ||
      typeof item.type !== "string" ||
      typeof item.updatedAt !== "string" ||
      !Number.isFinite(Date.parse(item.updatedAt)) ||
      ids.has(item.id)
    ) {
      return null;
    }
    ids.add(item.id);
    entries.push({
      id: item.id,
      type: item.type,
      updatedAt: new Date(item.updatedAt).toISOString(),
    });
  }
  return entries;
}

function sameDocumentSnapshot(
  expected: readonly DocumentSnapshotEntry[],
  actual: readonly DocumentSnapshotEntry[],
): boolean {
  if (expected.length !== actual.length) return false;
  const normalize = (entries: readonly DocumentSnapshotEntry[]) =>
    [...entries]
      .map((entry) => ({
        ...entry,
        updatedAt: new Date(entry.updatedAt).toISOString(),
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
  return JSON.stringify(normalize(expected)) === JSON.stringify(normalize(actual));
}

export async function claimCandidateWithCompareAndSet(
  candidate: DispatchCandidate,
  compareAndSet: () => Promise<boolean>,
): Promise<"claimed" | "stale" | "already_claimed"> {
  if (getDispatchCandidateStaleness(candidate)) return "stale";
  return (await compareAndSet()) ? "claimed" : "already_claimed";
}

export async function claimTargetedCandidate(
  expectedJobId: string,
  expectedApplicationId: string,
  candidate: DispatchCandidate,
  isProduction: boolean,
  compareAndSet: () => Promise<boolean>,
): Promise<
  | { kind: "claimed" }
  | { kind: "already_claimed" }
  | { kind: "association_mismatch" }
  | { kind: "stale"; code: string }
  | { kind: "invalid"; code: string }
  | { kind: "synthetic_blocked" }
> {
  if (
    candidate.jobId !== expectedJobId ||
    candidate.applicationId !== expectedApplicationId
  ) {
    return { kind: "association_mismatch" };
  }
  if (isProduction && candidate.isSynthetic) {
    return { kind: "synthetic_blocked" };
  }
  const staleness = getDispatchCandidateStaleness(candidate);
  if (staleness) return { kind: "stale", code: staleness };
  if (candidate.documentSnapshot == null) {
    return { kind: "invalid", code: "DOCUMENT_SNAPSHOT_MISSING" };
  }

  try {
    prepareAiVerificationInput(candidate);
  } catch (error) {
    if (error instanceof DispatchPreparationError) {
      return { kind: "invalid", code: error.code };
    }
    throw error;
  }

  return (await compareAndSet())
    ? { kind: "claimed" }
    : { kind: "already_claimed" };
}

function validatePolicySnapshot(
  policyId: string | null,
  schemeId: string,
  value: unknown,
): VerificationPolicySnapshot {
  if (!policyId || !isRecord(value)) {
    throw new DispatchPreparationError("POLICY_SNAPSHOT_MISSING");
  }
  if (
    value.schemaVersion !== 1 ||
    value.policyId !== policyId ||
    value.schemeId !== schemeId ||
    typeof value.policyVersion !== "number" ||
    !Number.isSafeInteger(value.policyVersion) ||
    value.policyVersion < 1 ||
    typeof value.publishedById !== "string" ||
    !value.publishedById ||
    typeof value.publishedAt !== "string" ||
    !Number.isFinite(Date.parse(value.publishedAt)) ||
    (value.isSynthetic !== undefined && typeof value.isSynthetic !== "boolean")
  ) {
    throw new DispatchPreparationError("POLICY_SNAPSHOT_INVALID");
  }

  const validated = validateVerificationPolicyForPublication({
    eligibilityCriteria: value.eligibilityCriteria,
    requiredDocumentTypes: value.requiredDocumentTypes,
    aiEligibleDocumentTypes: value.aiEligibleDocumentTypes,
    officialGuidelineReference: value.officialGuidelineReference,
    guidelineRevision: value.guidelineRevision,
  });
  if (!validated.success || !validated.value.officialGuidelineReference) {
    throw new DispatchPreparationError("POLICY_SNAPSHOT_INVALID");
  }

  return {
    schemaVersion: 1,
    policyId,
    schemeId,
    policyVersion: value.policyVersion,
    isSynthetic: value.isSynthetic === true,
    eligibilityCriteria: validated.value.eligibilityCriteria,
    requiredDocumentTypes: validated.value.requiredDocumentTypes,
    aiEligibleDocumentTypes: validated.value.aiEligibleDocumentTypes,
    officialGuidelineReference: validated.value.officialGuidelineReference,
    guidelineRevision: validated.value.guidelineRevision,
    publishedById: value.publishedById,
    publishedAt: new Date(value.publishedAt).toISOString(),
  };
}

function readApplicationValue(
  applicationData: Record<string, unknown>,
  path: string,
): unknown {
  let value: unknown = applicationData;
  for (const segment of path.split(".")) {
    if (!isRecord(value)) return undefined;
    value = value[segment];
  }
  return value;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function projectApplicationDataForCriteria(
  applicationData: unknown,
  policy: DeepReadonly<VerificationPolicySnapshot>,
): Record<string, unknown> {
  if (!isRecord(applicationData)) {
    throw new DispatchPreparationError("APPLICATION_DATA_INVALID");
  }

  const projected: Record<string, unknown> = {};
  for (const criterion of policy.eligibilityCriteria) {
    const path = fieldPaths[criterion.field] ?? criterion.field;
    const valueType = criterionFieldTypes.get(criterion.field);
    const rawValue = readApplicationValue(applicationData, path);
    if (valueType === "number") {
      const numberValue =
        typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "string" && rawValue.trim()
            ? Number(rawValue)
            : Number.NaN;
      if (!Number.isFinite(numberValue)) {
        throw new DispatchPreparationError("CRITERION_VALUE_MISSING_OR_INVALID");
      }
      projected[criterion.field] = numberValue;
    } else if (
      typeof rawValue === "string" &&
      rawValue.trim() &&
      (valueType !== "date" || isValidDate(rawValue))
    ) {
      projected[criterion.field] = rawValue;
    } else {
      throw new DispatchPreparationError("CRITERION_VALUE_MISSING_OR_INVALID");
    }
  }
  return projected;
}

export function selectAiEligibleDocuments(
  documents: readonly DispatchDocument[],
  policy: DeepReadonly<VerificationPolicySnapshot>,
): DispatchDocument[] {
  if (policy.aiEligibleDocumentTypes.length > AI_MAX_DOCUMENTS) {
    throw new DispatchPreparationError("POLICY_DOCUMENT_LIMIT_EXCEEDED");
  }
  const eligibleTypes: ReadonlySet<string> = new Set(policy.aiEligibleDocumentTypes);
  const eligibleDocuments = documents.filter((document) =>
    eligibleTypes.has(document.type),
  );
  const typesSeen = new Set<string>();
  for (const document of eligibleDocuments) {
    if (!supportedDocumentTypes.has(document.type) || typesSeen.has(document.type)) {
      throw new DispatchPreparationError("DUPLICATE_OR_UNSUPPORTED_AI_DOCUMENT");
    }
    typesSeen.add(document.type);
    if (!supportedImageMimeTypes.has(document.mimeType)) {
      throw new DispatchPreparationError("AI_DOCUMENT_FORMAT_UNSUPPORTED");
    }
  }

  return policy.aiEligibleDocumentTypes.flatMap((type) =>
    eligibleDocuments.filter(
      (document) =>
        document.type === type && supportedImageMimeTypes.has(document.mimeType),
    ),
  );
}

export function prepareAiVerificationInput(
  candidate: DispatchCandidate,
): AiVerificationInput {
  const staleness = getDispatchCandidateStaleness(candidate);
  if (staleness) throw new DispatchPreparationError(staleness);

  const policy = validatePolicySnapshot(
    candidate.policyId,
    candidate.applicationSchemeId,
    candidate.policySnapshot,
  );
  if (
    candidate.isSynthetic !== undefined &&
    candidate.isSynthetic !== policy.isSynthetic
  ) {
    throw new DispatchPreparationError("POLICY_SYNTHETIC_MARKER_MISMATCH");
  }
  const documents = selectAiEligibleDocuments(candidate.documents, policy);
  return {
    applicationId: candidate.applicationId,
    idempotencyKey: candidate.idempotencyKey,
    applicationData: projectApplicationDataForCriteria(
      candidate.applicationData,
      policy,
    ),
    criteria: policy.eligibilityCriteria,
    requiredDocumentTypes: policy.requiredDocumentTypes,
    aiEligibleDocumentTypes: policy.aiEligibleDocumentTypes,
    documentIds: documents.map((document) => document.id),
  };
}

export function classifyDispatchFailure(error: unknown): DispatchFailure {
  if (error instanceof DispatchPreparationError) {
    return { code: error.code, ambiguous: false };
  }
  if (error instanceof AiVerificationAdapterError) {
    if (
      error.code === "REQUEST_TIMEOUT" ||
      error.code === "NETWORK_FAILURE" ||
      error.code === "RESPONSE_INVALID" ||
      (error.code === "HTTP_FAILURE" &&
        (error.httpStatus === 409 || (error.httpStatus ?? 0) >= 500))
    ) {
      const code = error.code === "HTTP_FAILURE" && error.httpStatus === 409
        ? "IDEMPOTENCY_CONFLICT_AMBIGUOUS"
        : `${error.code}_AMBIGUOUS`;
      return { code, ambiguous: true };
    }
    return { code: `ADAPTER_${error.code}`, ambiguous: false };
  }
  return { code: "DISPATCH_UNEXPECTED_FAILURE", ambiguous: true };
}

export async function executeClaimedAiVerification(
  candidate: DispatchCandidate,
  dependencies: {
    submit(input: AiVerificationInput, signal?: AbortSignal): Promise<AiVerificationResult>;
    complete(candidate: DispatchCandidate, result: AiVerificationResult): Promise<void>;
    fail(candidate: DispatchCandidate, failure: DispatchFailure): Promise<void>;
  },
  signal?: AbortSignal,
): Promise<DispatchExecutionResult> {
  try {
    const input = prepareAiVerificationInput(candidate);
    if (signal?.aborted) {
      throw new AiVerificationAdapterError(
        "EXECUTION_TIMEOUT",
        "AI verification dispatch exceeded its execution budget.",
      );
    }
    const result = await dependencies.submit(input, signal);
    if (signal?.aborted) {
      throw new AiVerificationAdapterError(
        "REQUEST_TIMEOUT",
        "AI verification dispatch exceeded its execution budget.",
      );
    }
    if (result.applicationId !== candidate.applicationId) {
      throw new DispatchPreparationError("RESPONSE_APPLICATION_MISMATCH");
    }
    await dependencies.complete(candidate, result);
    return { kind: "completed", outcome: result.outcome };
  } catch (error) {
    const failure = classifyDispatchFailure(error);
    await dependencies.fail(candidate, failure);
    return { kind: "failed", failure };
  }
}
