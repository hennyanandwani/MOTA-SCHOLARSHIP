import { z } from 'zod';

// ─── Base Types ────────────────────────────────────────────────────────────────

export type I18nText = {
  en: string;
  hi?: string;
  [lang: string]: string | undefined;
};

// ─── User & Role Types ─────────────────────────────────────────────────────────

export type UserRole =
  | 'student'
  | 'guardian'
  | 'institution_officer'
  | 'state_officer'
  | 'ministry_reviewer'
  | 'selection_committee'
  | 'scheme_admin'
  | 'finance_officer'
  | 'leadership'
  | 'auditor'
  | 'super_admin'
  | 'public';

export interface User {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  isActive: boolean;
}

export interface ApplicantProfile {
  userId: string;
  name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  category: string;
  tribe?: string;
  religion?: string;
  mobile: string;
  email?: string;
  aadhaarMasked: string; // never full Aadhaar
  address: Address;
  annualFamilyIncome: number;
  parentOccupation?: string;
  isMinor: boolean;
  guardianId?: string;
}

export interface Guardian {
  id: string;
  name: string;
  relation: 'father' | 'mother' | 'legal_guardian';
  mobile: string;
  aadhaarMasked: string;
}

export interface Address {
  line1: string;
  line2?: string;
  village?: string;
  district: string;
  state: string;
  pincode: string;
}

// ─── Scheme Types ──────────────────────────────────────────────────────────────

export type SchemeCategory =
  | 'pre-matric'
  | 'post-matric'
  | 'fellowship'
  | 'overseas'
  | 'top-class'
  | 'other';

export type SchemeStatus = 'draft' | 'published' | 'archived';

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'phone'
  | 'email'
  | 'address'
  | 'file'
  | 'institution'
  | 'course'
  | 'tribe';

export type JsonLogic = Record<string, unknown>;

export interface FieldDef {
  key: string;
  label: I18nText;
  type: FieldType;
  required: boolean;
  showIf?: JsonLogic;
  validation?: Record<string, unknown>;
  prefillFrom?: { source: 'digilocker' | 'profile'; path: string };
  helper?: I18nText;
  icon?: string;
  options?: Array<{ value: string; label: I18nText }>;
  min?: number;
  max?: number;
}

export interface FormSection {
  key: string;
  label: I18nText;
  fields: FieldDef[];
  showIf?: JsonLogic;
}

export interface OcrFieldDef {
  key: string;
  label: I18nText;
  confidenceThreshold: number;
}

export interface DocumentDef {
  key: string;
  label: I18nText;
  mandatory: boolean;
  acceptedSources: ('upload' | 'digilocker' | 'institution')[];
  preferredSource: 'upload' | 'digilocker' | 'institution';
  validityMonths?: number;
  ocrFields: OcrFieldDef[];
  maxSizeMb: number;
  mimeTypes: string[];
  showIf?: JsonLogic;
}

export type RuleKind = 'eligibility' | 'document' | 'selection-gate';
export type RuleSeverity = 'blocking' | 'warning';

export interface RuleDef {
  key: string;
  label: I18nText;
  kind: RuleKind;
  logic: JsonLogic;
  severity: RuleSeverity;
  explainMet: I18nText;
  explainFail: I18nText;
  dataDeps: string[];
}

export type StageKind = 'auto' | 'human' | 'committee';

export interface StageDef {
  key: string;
  label: I18nText;
  role: UserRole;
  slaDays: number;
  order: number;
  kind: StageKind;
}

export interface TransitionDef {
  from: string;
  to: string;
  allowedRoles: UserRole[];
  requiresReason: boolean;
  label?: I18nText;
}

export type SelectionMethod = 'rank' | 'threshold' | 'lottery-free-manual';

export interface CriterionDef {
  key: string;
  label: I18nText;
  weight: number;
  source: string;
}

export interface QuotaDef {
  key: string;
  label: I18nText;
  percentage: number;
  condition?: JsonLogic;
}

export interface BenefitDef {
  icon: string;
  label: I18nText;
  amount?: number;
  unit?: string;
}

export interface TaskDef {
  key: string;
  label: I18nText;
  role: UserRole;
  daysAfterSelection: number;
}

export interface SchemeVersion {
  number: number;
  publishedAt: string;
  publishedBy: string;
  changeNote: string;
}

export interface SchemeConfig {
  id: string;
  code: string;
  slug: string;
  category: SchemeCategory;
  name: I18nText;
  tagline: I18nText;
  icon: string;
  status: SchemeStatus;
  version: SchemeVersion;
  applicantType: 'self' | 'guardian-led';
  window: {
    opensAt: string;
    closesAt: string;
  };
  benefits: BenefitDef[];
  seats?: {
    total: number;
    quotas: QuotaDef[];
  };
  sections: FormSection[];
  documents: DocumentDef[];
  rules: RuleDef[];
  workflow: {
    stages: StageDef[];
    transitions: TransitionDef[];
  };
  selection: {
    method: SelectionMethod;
    criteria: CriterionDef[];
    tieBreakers: string[];
    quotas: QuotaDef[];
  };
  communication: {
    templates: Record<string, { subject: I18nText; body: I18nText }>;
  };
  postSelection: {
    tasks: TaskDef[];
    paymentSchedule: Array<{
      installment: number;
      label: I18nText;
      daysAfterSelection: number;
      percentage: number;
    }>;
  };
}

// ─── Application Types ─────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'draft'
  | 'in_progress'
  | 'deficient'
  | 'on_hold'
  | 'selected'
  | 'waitlisted'
  | 'rejected'
  | 'withdrawn'
  | 'closed';

export type TriageLane = 'green' | 'amber' | 'red';

export interface Application {
  id: string;
  schemeId: string;
  schemeVersion: number; // frozen at submission
  applicantId: string;
  guardianId?: string;
  stageKey: string; // current workflow stage key from scheme config
  status: ApplicationStatus;
  triageLane?: TriageLane;
  formData: Record<string, unknown>;
  score?: number;
  rank?: number;
  submittedAt?: string;
  updatedAt: string;
  createdAt: string;
  slaDeadline?: string;
  isAssistedMode: boolean;
  assistedBy?: string;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentKey: string;
  source: 'upload' | 'digilocker' | 'institution';
  status: 'pending' | 'verified' | 'rejected' | 'deficient';
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt: string;
  verifiedAt?: string;
  ocrResult?: Record<string, { value: string; confidence: number }>;
  issuer?: string;
  fetchedAt?: string;
  hash?: string;
}

export interface Deficiency {
  id: string;
  applicationId: string;
  documentKey?: string;
  fieldKey?: string;
  reason: I18nText;
  raisedAt: string;
  raisedBy: string;
  resolvedAt?: string;
  status: 'open' | 'resolved' | 'escalated';
}

export interface AIFinding {
  id: string;
  applicationId: string;
  type: 'duplicate' | 'fraud_signal' | 'ocr_low_confidence' | 'fake_institution' | 'income_mismatch';
  severity: 'low' | 'medium' | 'high';
  description: I18nText;
  confidence: number;
  evidence: Record<string, unknown>;
  flaggedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  verdict?: 'confirmed' | 'dismissed';
}

// ─── Workflow Types ────────────────────────────────────────────────────────────

export interface WorkflowStage {
  key: string;
  label: I18nText;
  role: UserRole;
  slaDays: number;
  order: number;
  kind: StageKind;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  allowedRoles: UserRole[];
  requiresReason: boolean;
}

export interface AuditEvent {
  id: string;
  applicationId: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  fromStage?: string;
  toStage?: string;
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ─── Payment & Sanction Types ─────────────────────────────────────────────────

export type PaymentStatusValue = 'pending' | 'processing' | 'paid' | 'failed' | 'reversed';

export interface PaymentStatus {
  sanctionId: string;
  applicationId: string;
  amount: number;
  installment: number;
  status: PaymentStatusValue;
  scheduledAt: string;
  processedAt?: string;
  utr?: string;
  bankAccount?: string;
}

export interface Sanction {
  id: string;
  applicationId: string;
  schemeId: string;
  applicantId: string;
  amount: number;
  sanctionedAt: string;
  sanctionedBy: string;
  payments: PaymentStatus[];
}

// ─── Notification & Grievance ──────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: I18nText;
  body: I18nText;
  type: 'info' | 'success' | 'warning' | 'error';
  channel: 'in_app' | 'sms' | 'email' | 'whatsapp';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface Grievance {
  id: string;
  applicationId?: string;
  applicantId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}

// ─── Fraud & Analytics ────────────────────────────────────────────────────────

export interface FraudCluster {
  id: string;
  type: 'duplicate_identity' | 'same_bank' | 'same_institution_batch' | 'income_anomaly';
  applicationIds: string[];
  confidence: number;
  detectedAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

export interface PolicySimulation {
  id: string;
  name: string;
  schemeId: string;
  parameters: Record<string, unknown>;
  result: {
    eligibleCount: number;
    selectedCount: number;
    totalBudget: number;
    diversityMetrics: Record<string, number>;
  };
  createdAt: string;
  createdBy: string;
}

// ─── DigiLocker Types ─────────────────────────────────────────────────────────

export interface DigiLockerConsent {
  userId: string;
  consentToken: string;
  grantedAt: string;
  expiresAt: string;
  scope: string[];
  revoked: boolean;
}

export interface AssistedSession {
  id: string;
  applicantId: string;
  operatorId: string;
  startedAt: string;
  endedAt?: string;
  applicationId?: string;
  auditLog: string[];
}

// ─── API Response Envelopes ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Zod Schemas (selected) ───────────────────────────────────────────────────

export const I18nTextSchema = z.object({
  en: z.string(),
  hi: z.string().optional(),
}).catchall(z.string().optional());

export const ApplicationStatusSchema = z.enum([
  'draft', 'in_progress', 'deficient', 'on_hold', 'selected',
  'waitlisted', 'rejected', 'withdrawn', 'closed',
]);

export const SchemeCategorySchema = z.enum([
  'pre-matric', 'post-matric', 'fellowship', 'overseas', 'top-class', 'other',
]);
