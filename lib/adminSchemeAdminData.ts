import type { AdminSchemeSummary } from '@/lib/adminData';
import type { Scheme } from '@/lib/schemes';

export type ManagedSchemeStatus = 'Active' | 'Draft' | 'Upcoming' | 'Closed' | 'Inactive';
export type SchemeWindowStatus = 'Open' | 'Upcoming' | 'Closed';

export type SchemeEligibility = {
  categoryRequirement: string;
  ageCriteria: string;
  incomeCriteria: string;
  academicCriteria: string;
  courseInstitutionCriteria: string;
  otherConditions: string;
};

export type SchemeBenefits = {
  amount: string;
  duration: string;
  frequency: string;
  additionalSupport: string;
};

export type SchemeQuota = {
  category: string;
  seats: number;
  region: string;
};

export type ManagedScheme = {
  id: string;
  name: string;
  code: string;
  type: 'Scholarship' | 'Fellowship';
  academicYear: string;
  openingDate: string;
  closingDate: string;
  intakeCapacity: number;
  applications: number;
  benefits: SchemeBenefits;
  eligibility: SchemeEligibility;
  requiredDocuments: string[];
  status: ManagedSchemeStatus;
  ministry: string;
  department: string;
  category: string;
  categoryQuotas: SchemeQuota[];
  allocatedSeats: number;
  createdAt: string;
  updatedAt: string;
};

export const ADMIN_SCHEMES_STORAGE_KEY = 'mota_admin_schemes_state';

const sampleDocuments = [
  'Identity proof',
  'Scheduled Tribe certificate',
  'Family income certificate',
  'Academic marksheet',
  'Bank account details',
  'Institution and course proof',
];

function asDate(value: string): string {
  const match = value.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!match) return '';
  const month = new Date(`${match[2]} 1, ${match[3]}`).getMonth() + 1;
  return `${match[3]}-${String(month).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
}

function academicYearFromDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '2026–27';
  const year = date.getFullYear();
  const start = date.getMonth() < 3 ? year - 1 : year;
  return `${start}–${String((start + 1) % 100).padStart(2, '0')}`;
}

function managedStatus(status: Scheme['status']): ManagedSchemeStatus {
  if (status === 'Open') return 'Active';
  return status;
}

function createSeedScheme(scheme: Scheme, summary: AdminSchemeSummary | undefined): ManagedScheme {
  const closingDate = scheme.deadlineDate || asDate(scheme.deadline);
  const openingDate = scheme.addedDate || '2026-04-01';
  const fellowship = scheme.type === 'Fellowship';
  const categoryQuota = summary
    ? Math.max(0, Math.round(summary.totalSlots * 0.5))
    : 0;

  return {
    id: scheme.id,
    name: scheme.name,
    code: scheme.id.toUpperCase().replace(/-/g, '-'),
    type: scheme.type,
    academicYear: academicYearFromDate(closingDate),
    openingDate,
    closingDate,
    intakeCapacity: summary?.totalSlots ?? 0,
    applications: summary?.applications ?? 0,
    benefits: {
      amount: fellowship ? '₹31,000 per month (illustrative)' : 'Up to ₹2,50,000 per year (illustrative)',
      duration: fellowship ? 'Up to 5 years' : 'One academic year; renewable subject to rules',
      frequency: fellowship ? 'Monthly' : 'Annual',
      additionalSupport: fellowship ? 'Contingency and HRA as per applicable rules (illustrative)' : 'Tuition and maintenance support as configured (illustrative)',
    },
    eligibility: {
      categoryRequirement: 'Scheduled Tribe (ST) applicants; certificate verification required.',
      ageCriteria: 'As specified in the notified scheme guidelines.',
      incomeCriteria: 'Illustrative ceiling applies; confirm current scheme guidelines.',
      academicCriteria: `Academic level: ${scheme.academicLevel}; detailed merit rules are scheme-configured.`,
      courseInstitutionCriteria: 'Recognized institution and eligible course as per notified scheme guidelines.',
      otherConditions: scheme.description,
    },
    requiredDocuments: [...sampleDocuments, ...(fellowship ? ['Research proposal / fellowship-specific proof'] : [])],
    status: managedStatus(scheme.status),
    ministry: 'Ministry of Tribal Affairs',
    department: fellowship ? 'Education & Fellowship Division' : 'Scholarship Division',
    category: 'Scheduled Tribe (ST)',
    categoryQuotas: categoryQuota
      ? [{ category: 'Scheduled Tribe (ST)', seats: categoryQuota, region: 'National allocation (illustrative)' }]
      : [],
    allocatedSeats: summary?.selected ?? 0,
    createdAt: scheme.addedDate,
    updatedAt: scheme.addedDate,
  };
}

export function createInitialManagedSchemes(
  schemes: Scheme[],
  summaries: AdminSchemeSummary[],
): ManagedScheme[] {
  const summaryById = new Map(summaries.map((summary) => [summary.schemeId, summary]));
  return schemes.map((scheme) => createSeedScheme(scheme, summaryById.get(scheme.id)));
}

export function isManagedScheme(value: unknown): value is ManagedScheme {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const scheme = value as Partial<ManagedScheme>;
  return (
    typeof scheme.id === 'string' &&
    typeof scheme.name === 'string' &&
    typeof scheme.code === 'string' &&
    (scheme.type === 'Scholarship' || scheme.type === 'Fellowship') &&
    typeof scheme.academicYear === 'string' &&
    typeof scheme.openingDate === 'string' &&
    typeof scheme.closingDate === 'string' &&
    typeof scheme.intakeCapacity === 'number' &&
    typeof scheme.applications === 'number' &&
    Boolean(scheme.benefits && typeof scheme.benefits === 'object') &&
    Boolean(scheme.eligibility && typeof scheme.eligibility === 'object') &&
    Array.isArray(scheme.requiredDocuments) &&
    scheme.requiredDocuments.every((document) => typeof document === 'string') &&
    (scheme.status === 'Active' ||
      scheme.status === 'Draft' ||
      scheme.status === 'Upcoming' ||
      scheme.status === 'Closed' ||
      scheme.status === 'Inactive') &&
    typeof scheme.ministry === 'string' &&
    typeof scheme.department === 'string' &&
    typeof scheme.category === 'string' &&
    Array.isArray(scheme.categoryQuotas) &&
    typeof scheme.allocatedSeats === 'number' &&
    typeof scheme.createdAt === 'string' &&
    typeof scheme.updatedAt === 'string'
  );
}

export function isManagedSchemeList(value: unknown): value is ManagedScheme[] {
  return Array.isArray(value) && value.every(isManagedScheme);
}

export function getWindowStatus(scheme: ManagedScheme, now = new Date()): SchemeWindowStatus {
  if (scheme.status === 'Closed' || scheme.status === 'Inactive') return 'Closed';
  if (scheme.status === 'Upcoming') return 'Upcoming';
  if (scheme.status !== 'Active') return 'Closed';
  const opening = new Date(`${scheme.openingDate}T00:00:00`);
  const closing = new Date(`${scheme.closingDate}T23:59:59`);
  if (Number.isNaN(opening.getTime()) || Number.isNaN(closing.getTime())) return 'Closed';
  if (now < opening) return 'Upcoming';
  if (now > closing) return 'Closed';
  return 'Open';
}

export function daysRemaining(scheme: ManagedScheme, now = new Date()): number | null {
  if (getWindowStatus(scheme, now) !== 'Open') return null;
  const closing = new Date(`${scheme.closingDate}T23:59:59`);
  return Math.max(0, Math.ceil((closing.getTime() - now.getTime()) / 86_400_000));
}
