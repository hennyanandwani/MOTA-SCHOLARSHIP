'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileBarChart2,
  Filter,
  MapPin,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import type {
  AdminActivityLog,
  AdminApplicationRecord,
  AdminSchemeSummary,
  StateGeographicData,
  WorkflowStageSummary,
} from '@/lib/adminData';
import type { DeficiencyRecord } from '@/lib/adminDeficiencyData';
import type { VerificationRecord } from '@/lib/adminVerificationData';
import {
  SCREENING_STORAGE_KEY,
  isStoredScreeningState,
  mergeScreeningState,
  type ScreeningCase,
  type StoredScreeningState,
} from '@/lib/adminScreeningData';
import {
  SELECTION_STORAGE_KEY,
  isStoredSelectionState,
  mergeSelectionState,
  type SelectionCase,
  type StoredSelectionState,
} from '@/lib/adminSelectionData';
import type { Scheme } from '@/lib/schemes';
import { IndiaHeatmap } from '@/components/admin/analytics/IndiaHeatmap';
import {
  createInitialManagedSchemes,
  isManagedSchemeList,
  type ManagedScheme,
} from '@/lib/adminSchemeAdminData';

type Props = {
  applications: AdminApplicationRecord[];
  schemes: Scheme[];
  schemeSummaries: AdminSchemeSummary[];
  verifications: VerificationRecord[];
  deficiencies: DeficiencyRecord[];
  screeningCases: ScreeningCase[];
  selectionCases: SelectionCase[];
  workflowStages: WorkflowStageSummary[];
  geographicData: StateGeographicData[];
  activity: AdminActivityLog[];
};

type ReportRow = Record<string, string | number>;
type ReportDefinition = {
  title: string;
  description: string;
  rows: ReportRow[];
};
type TrendInterval = 'daily' | 'weekly' | 'monthly';
type SortKey = 'applications' | 'selectionRate' | 'processingTime' | 'pending';

const statusOptions = ['All statuses', 'Under Review', 'Action Required', 'Verified', 'Screened', 'Selected', 'Rejected', 'Sanctioned'];
const workflowOrder = ['Submitted', 'Verification', 'Scrutiny', 'Screening', 'Selection', 'Disbursement'];
const deficiencyCategories = ['Missing Document', 'Invalid Document', 'Incomplete Information', 'Mismatch', 'Unclear Document', 'Other'];
const reportDefinitions = [
  { title: 'Application Status Report', description: 'Application registry counts by current workflow status.' },
  { title: 'Verification Report', description: 'Illustrative document verification outcomes and case status.' },
  { title: 'Deficiency Report', description: 'Open, resolved and categorized deficiency cases.' },
  { title: 'Screening Report', description: 'AI-assisted assessments and pending official screening reviews.' },
  { title: 'Selection & Sanction Report', description: 'Merit recommendations, selection, approvals and sanction readiness.' },
  { title: 'Scheme Performance Report', description: 'Application volume, verification progress and selection rate by scheme.' },
  { title: 'State-wise Application Report', description: 'Applications and workflow indicators by state or UT.' },
  { title: 'Processing Time Report', description: 'Illustrative stage processing intervals and registry elapsed time.' },
  { title: 'Audit / Activity Summary', description: 'Recent illustrative administrative activity.' },
];

function percentage(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function dateInputValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function normalizeDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateInputValue(date);
}

function daysBetween(start: string, end: string): number | null {
  const first = new Date(`${start}T00:00:00`).getTime();
  const second = new Date(`${end}T00:00:00`).getTime();
  if (Number.isNaN(first) || Number.isNaN(second)) return null;
  return Math.max(0, Math.round((second - first) / 86_400_000));
}

function csvEscape(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: ReportRow[]): void {
  if (!rows.length) return;
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const content = [
    ['Data Classification', ...columns].map(csvEscape).join(','),
    ...rows.map((row) => ['Demo / Illustrative', ...columns.map((column) => row[column] ?? '')].map(csvEscape).join(',')),
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

function toReportRows<T>(items: T[], mapper: (item: T) => ReportRow): ReportRow[] {
  return items.map(mapper);
}

function reportFor(title: string, input: {
  applications: AdminApplicationRecord[];
  verifications: VerificationRecord[];
  deficiencies: DeficiencyRecord[];
  screening: ScreeningCase[];
  selection: SelectionCase[];
  activity: AdminActivityLog[];
  processingTimes: number[];
  processingStages: { label: string; days: number }[];
  stateRows: StateRow[];
  schemeRows: SchemeRow[];
}): ReportDefinition {
  const {
    applications, verifications, deficiencies, screening, selection,
    activity, processingTimes, processingStages, stateRows, schemeRows,
  } = input;
  const definitions: Record<string, ReportDefinition> = {
    'Application Status Report': {
      title,
      description: 'Filtered application records by status.',
      rows: toReportRows(applications, (item) => ({
        'Application ID': item.applicationId, Applicant: item.applicantName, Scheme: item.schemeName,
        State: item.state, 'Academic Year': item.academicYear, Status: item.status, Stage: item.currentStage,
        'Submitted Date': item.submittedDate,
      })),
    },
    'Verification Report': {
      title,
      description: 'Filtered illustrative document verification records.',
      rows: toReportRows(verifications, (item) => ({
        'Verification ID': item.id, 'Application ID': item.applicationId, Applicant: item.applicantName,
        Scheme: item.schemeName, State: item.state, Document: item.documentName,
        'Verification Status': item.verificationStatus, 'AI-assisted match': item.aiMatch,
      })),
    },
    'Deficiency Report': {
      title,
      description: 'Filtered illustrative deficiency records.',
      rows: toReportRows(deficiencies, (item) => ({
        'Deficiency ID': item.id, 'Application ID': item.applicationId, Applicant: item.applicantName,
        Scheme: item.scheme, State: item.state, Type: item.deficiencyType, Issue: item.deficiency,
        Status: item.status, 'Raised Date': item.raisedDate,
      })),
    },
    'Screening Report': {
      title,
      description: 'Screening assistance and official review statuses. This is not a final eligibility decision.',
      rows: toReportRows(screening, (item) => ({
        'Application ID': item.application.applicationId, Applicant: item.application.applicantName,
        Scheme: item.application.schemeName, State: item.application.state,
        'Assessment Status': item.screeningStatus, 'Official Review': item.officialReviewStatus,
      })),
    },
    'Selection & Sanction Report': {
      title,
      description: 'Selection recommendations and sanction workflow remain subject to authorized officials.',
      rows: toReportRows(selection, (item) => ({
        'Application ID': item.application.applicationId, Applicant: item.application.applicantName,
        Scheme: item.application.schemeName, State: item.application.state, Rank: item.rank,
        'Merit Score': item.totalMeritScore, 'Selection Status': item.selectionStatus,
        'Approval Status': item.approvalStatus, 'Sanction Status': item.sanctionStatus,
      })),
    },
    'Scheme Performance Report': {
      title,
      description: 'Scheme performance derived from filtered application records.',
      rows: toReportRows(schemeRows, (item) => ({
        Scheme: item.name, Applications: item.applications, Verified: item.verified,
        Selected: item.selected, Pending: item.pending, 'Selection Rate (%)': item.selectionRate,
        'Average Processing (days)': item.processingTime,
      })),
    },
    'State-wise Application Report': {
      title,
      description: 'State/UT summary derived from filtered application records.',
      rows: toReportRows(stateRows, (item) => ({
        State: item.state, Applications: item.applications, Verified: item.verified,
        Pending: item.pending, Deficiencies: item.deficiencies, Selected: item.selected,
        'Deficiency Ratio (%)': item.deficiencyRatio, 'Selection Ratio (%)': item.selectionRatio,
      })),
    },
    'Processing Time Report': {
      title,
      description: 'Registry elapsed time and illustrative stage duration values.',
      rows: [
        ...processingStages.map((stage) => ({ Metric: stage.label, 'Average days': stage.days, Basis: 'Existing illustrative workflow data' })),
        ...processingTimes.map((days, index) => ({ 'Application ID': applications[index]?.applicationId ?? '', Metric: 'Submit to last recorded action', 'Average days': days, Basis: 'Calculated from demo application dates' })),
      ],
    },
    'Audit / Activity Summary': {
      title,
      description: 'Recent illustrative administrative activity records.',
      rows: toReportRows(activity, (item) => ({
        Timestamp: item.timestamp, Activity: item.activity, 'Application ID': item.applicationId,
        Applicant: item.applicantName ?? '', Actor: item.actor, Role: item.role, Status: item.status,
      })),
    },
  };
  return definitions[title] ?? { title, description: '', rows: [] };
}

type SchemeRow = {
  id: string;
  name: string;
  applications: number;
  verified: number;
  selected: number;
  pending: number;
  selectionRate: number;
  processingTime: number;
};

type StateRow = {
  state: string;
  applications: number;
  verified: number;
  pending: number;
  deficiencies: number;
  selected: number;
  deficiencyRatio: number;
  selectionRatio: number;
};

type TrendRow = { label: string; received: number; verified: number; selected: number };

function bucketKey(dateValue: string, interval: TrendInterval): string {
  const [yearPart, monthPart, dayPart] = dateValue.split('-').map(Number);
  const date = new Date(Date.UTC(yearPart, monthPart - 1, dayPart));
  if (Number.isNaN(date.getTime())) return '';
  if (interval === 'monthly') return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  if (interval === 'weekly') {
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function formatBucket(key: string, interval: TrendInterval): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (interval === 'monthly') {
    const [year, month] = key.split('-').map(Number);
    return `${monthNames[month - 1]} '${String(year).slice(-2)}`;
  }
  const [, monthPart, dayPart] = key.split('-').map(Number);
  return `${dayPart} ${monthNames[monthPart - 1]}`;
}

function createTrend(
  applications: AdminApplicationRecord[],
  interval: TrendInterval,
  selectedApplicationIds: ReadonlySet<string>,
): TrendRow[] {
  const buckets = new Map<string, TrendRow>();
  for (const application of applications) {
    const key = bucketKey(application.submittedDate, interval);
    if (!key) continue;
    const row = buckets.get(key) ?? { label: formatBucket(key, interval), received: 0, verified: 0, selected: 0 };
    row.received += 1;
    if (application.verificationStatus === 'Verified') row.verified += 1;
    if (selectedApplicationIds.has(application.applicationId)) row.selected += 1;
    buckets.set(key, row);
  }
  return [...buckets.entries()].sort(([first], [second]) => first.localeCompare(second)).map(([, row]) => row);
}

export function AnalyticsPageClient(props: Props) {
  const {
    applications: allApplications, schemes, schemeSummaries, verifications: initialVerifications,
    deficiencies: initialDeficiencies, screeningCases: initialScreening, selectionCases: initialSelection,
    workflowStages, geographicData, activity: allActivity,
  } = props;
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [academicYear, setAcademicYear] = useState('All academic years');
  const [schemeFilter, setSchemeFilter] = useState('All schemes');
  const [stateFilter, setStateFilter] = useState('All states / UTs');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [stageFilter, setStageFilter] = useState('All stages');
  const [interval, setInterval] = useState<TrendInterval>('weekly');
  const [schemeSort, setSchemeSort] = useState<SortKey>('applications');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDeficiencyType, setSelectedDeficiencyType] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [storedVerifications, setStoredVerifications] = useState(initialVerifications);
  const [storedDeficiencies, setStoredDeficiencies] = useState(initialDeficiencies);
  const [screeningState, setScreeningState] = useState<StoredScreeningState>({});
  const [selectionState, setSelectionState] = useState<StoredSelectionState>({});
  const initialManagedSchemes = useMemo(() => createInitialManagedSchemes(schemes, schemeSummaries), [schemes, schemeSummaries]);
  const [managedSchemes, setManagedSchemes] = useState<ManagedScheme[]>(initialManagedSchemes);
  const [storageNotice, setStorageNotice] = useState('');

  useEffect(() => {
    const noticeParts: string[] = [];
    try {
      const verificationValue = window.localStorage.getItem('mota_admin_verification_state');
      if (verificationValue) {
        const parsed: unknown = JSON.parse(verificationValue);
        if (Array.isArray(parsed) && parsed.every((item) =>
          item && typeof item.id === 'string' && typeof item.applicationId === 'string' &&
          typeof item.verificationStatus === 'string' && typeof item.schemeId === 'string' &&
          typeof item.state === 'string' && Array.isArray(item.flags))) {
          setStoredVerifications(parsed as VerificationRecord[]);
        } else noticeParts.push('verification');
      }
      const deficiencyValue = window.localStorage.getItem('mota_admin_deficiencies_state');
      if (deficiencyValue) {
        const parsed: unknown = JSON.parse(deficiencyValue);
        if (Array.isArray(parsed) && parsed.every((item) =>
          item && typeof item.id === 'string' && typeof item.applicationId === 'string' &&
          typeof item.status === 'string' && typeof item.deficiencyType === 'string' &&
          typeof item.state === 'string' && typeof item.scheme === 'string')) {
          setStoredDeficiencies(parsed as DeficiencyRecord[]);
        } else noticeParts.push('deficiency');
      }
      const screeningValue = window.localStorage.getItem(SCREENING_STORAGE_KEY);
      if (screeningValue) {
        const parsed: unknown = JSON.parse(screeningValue);
        if (isStoredScreeningState(parsed)) setScreeningState(parsed);
        else noticeParts.push('screening');
      }
      const selectionValue = window.localStorage.getItem(SELECTION_STORAGE_KEY);
      if (selectionValue) {
        const parsed: unknown = JSON.parse(selectionValue);
        if (isStoredSelectionState(parsed)) setSelectionState(parsed);
        else noticeParts.push('selection');
      }
      const schemeValue = window.localStorage.getItem('mota_admin_schemes_state');
      if (schemeValue) {
        const parsed: unknown = JSON.parse(schemeValue);
        if (isManagedSchemeList(parsed)) setManagedSchemes(parsed);
        else noticeParts.push('scheme');
      }
    } catch {
      noticeParts.push('saved analytics inputs');
    }
    if (noticeParts.length) setStorageNotice(`Some saved ${noticeParts.join(', ')} data could not be read; available demo records are displayed.`);
  }, []);

  const academicYears = useMemo(() => [...new Set(allApplications.map((item) => item.academicYear))].sort(), [allApplications]);
  const states = useMemo(() => [...new Set([
    ...allApplications.map((item) => item.state),
    ...initialVerifications.map((item) => item.state),
    ...initialDeficiencies.map((item) => item.state),
    ...geographicData.map((item) => item.state),
  ])].sort(), [allApplications, initialVerifications, initialDeficiencies, geographicData]);
  const applicationById = useMemo(() => new Map(allApplications.map((item) => [item.applicationId, item])), [allApplications]);
  const baseFilteredApplications = useMemo(() => allApplications.filter((application) => {
    const submitted = normalizeDate(application.submittedDate);
    return (academicYear === 'All academic years' || application.academicYear === academicYear) &&
      (schemeFilter === 'All schemes' || application.schemeId === schemeFilter) &&
      (stateFilter === 'All states / UTs' || application.state === stateFilter) &&
      (statusFilter === 'All statuses' ||
        (statusFilter === 'Selected'
          ? application.status === 'Selected' || selectionState[application.applicationId]?.selectionStatus === 'Selected'
          : statusFilter === 'Sanctioned'
            ? application.status === 'Sanctioned' || selectionState[application.applicationId]?.sanctionStatus === 'Sanctioned'
            : application.status === statusFilter)) &&
      (!dateFrom || (submitted && submitted >= dateFrom)) &&
      (!dateTo || (submitted && submitted <= dateTo));
  }), [allApplications, academicYear, schemeFilter, stateFilter, statusFilter, dateFrom, dateTo, selectionState]);
  const filteredApplications = useMemo(() => baseFilteredApplications.filter((application) =>
    stageFilter === 'All stages' ||
    (stageFilter === 'Verification' && application.currentStage === 'Verification') ||
    (stageFilter === 'Deficiency' && application.deficiencyStatus !== 'None') ||
    (stageFilter === 'Screening' && ['Scrutiny', 'Screening'].includes(application.currentStage)) ||
    (stageFilter === 'Selection' && (application.currentStage === 'Selection' || application.status === 'Selected' || application.status === 'Sanctioned' || selectionState[application.applicationId]?.selectionStatus === 'Selected' || selectionState[application.applicationId]?.sanctionStatus === 'Sanctioned')) ||
    (stageFilter === 'Sanction' && (application.status === 'Sanctioned' || selectionState[application.applicationId]?.sanctionStatus === 'Sanctioned')),
  ), [baseFilteredApplications, stageFilter, selectionState]);

  const applicationIds = useMemo(() => new Set(filteredApplications.map((item) => item.applicationId)), [filteredApplications]);
  const baseApplicationIds = useMemo(() => new Set(baseFilteredApplications.map((item) => item.applicationId)), [baseFilteredApplications]);
  const filteredVerifications = useMemo(() => storedVerifications.filter((record) =>
    (!applicationById.has(record.applicationId) || applicationIds.has(record.applicationId)) &&
    (schemeFilter === 'All schemes' || record.schemeId === schemeFilter) &&
    (stateFilter === 'All states / UTs' || record.state === stateFilter) &&
    (statusFilter === 'All statuses' || !applicationById.has(record.applicationId) || applicationById.get(record.applicationId)?.status === statusFilter) &&
    (!dateFrom || normalizeDate(record.uploadedAt) >= dateFrom) &&
    (!dateTo || normalizeDate(record.uploadedAt) <= dateTo),
  ), [storedVerifications, applicationById, applicationIds, schemeFilter, stateFilter, statusFilter, dateFrom, dateTo]);
  const filteredDeficiencies = useMemo(() => storedDeficiencies.filter((record) =>
    (!applicationById.has(record.applicationId) || applicationIds.has(record.applicationId)) &&
    (stateFilter === 'All states / UTs' || record.state === stateFilter) &&
    (schemeFilter === 'All schemes' || (() => {
      const selectedSchemeName = managedSchemes.find((scheme) => scheme.id === schemeFilter)?.name.toLocaleLowerCase() ?? '';
      const recordSchemeName = record.scheme.toLocaleLowerCase();
      return selectedSchemeName === recordSchemeName ||
        selectedSchemeName.includes(recordSchemeName) ||
        recordSchemeName.includes(selectedSchemeName);
    })()) &&
    (statusFilter === 'All statuses' || !applicationById.has(record.applicationId) || applicationById.get(record.applicationId)?.status === statusFilter) &&
    (!dateFrom || normalizeDate(record.raisedDate) >= dateFrom) &&
    (!dateTo || normalizeDate(record.raisedDate) <= dateTo),
  ), [storedDeficiencies, applicationById, applicationIds, stateFilter, schemeFilter, managedSchemes, statusFilter, dateFrom, dateTo]);
  const baseScreening = useMemo(() => mergeScreeningState(initialScreening, screeningState).filter((item) => applicationIds.has(item.application.applicationId)), [initialScreening, screeningState, applicationIds]);
  const baseSelectionCases = useMemo(() => mergeSelectionState(initialSelection, selectionState).filter((item) => baseApplicationIds.has(item.application.applicationId)), [initialSelection, selectionState, baseApplicationIds]);
  const baseSelection = useMemo(() => baseSelectionCases.filter((item) => applicationIds.has(item.application.applicationId)), [baseSelectionCases, applicationIds]);
  const selectedApplicationIds = useMemo(() => new Set(baseSelectionCases
    .filter((item) => item.selectionStatus === 'Selected' || item.sanctionStatus === 'Sanctioned' || item.application.status === 'Sanctioned')
    .map((item) => item.application.applicationId)), [baseSelection]);

  const verifiedCount = filteredApplications.filter((item) => item.verificationStatus === 'Verified').length;
  const underReviewCount = filteredApplications.filter((item) => item.status === 'Under Review' || item.status === 'Action Required').length;
  const selectedCount = filteredApplications.filter((item) => selectedApplicationIds.has(item.applicationId)).length;
  const pendingApprovalCount = baseSelection.filter((item) => item.approvalStatus === 'Pending Approval').length;
  const processingTimes = filteredApplications.map((item) => daysBetween(item.submittedDate, item.lastActionDate)).filter((value): value is number => value !== null);
  const averageProcessingDays = processingTimes.length
    ? Math.round(processingTimes.reduce((total, value) => total + value, 0) / processingTimes.length)
    : 0;
  const selectionRate = percentage(selectedCount, filteredApplications.length);
  const activeDeficiencies = filteredDeficiencies.filter((item) => !['Resolved', 'Rejected'].includes(item.status));
  const overdueDeficiencies = activeDeficiencies.filter((item) => {
    const deadline = new Date(item.cureDeadline);
    return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
  });
  const verifiedDocuments = filteredVerifications.filter((item) => item.verificationStatus === 'Verified').length;
  const reviewDocuments = filteredVerifications.filter((item) => item.verificationStatus === 'Under Review').length;
  const flaggedDocuments = filteredVerifications.filter((item) => item.verificationStatus === 'Rejected' || item.flags.length > 0).length;
  const pendingDocuments = filteredVerifications.filter((item) => item.verificationStatus === 'Pending').length;

  const schemeRows = useMemo<SchemeRow[]>(() => {
    const entries = managedSchemes.map((scheme) => {
      const records = filteredApplications.filter((item) => item.schemeId === scheme.id);
      const selected = records.filter((item) => selectedApplicationIds.has(item.applicationId)).length;
      const times = records.map((item) => daysBetween(item.submittedDate, item.lastActionDate)).filter((value): value is number => value !== null);
      return {
        id: scheme.id,
        name: scheme.name,
        applications: records.length,
        verified: records.filter((item) => item.verificationStatus === 'Verified').length,
        selected,
        pending: records.filter((item) => item.status === 'Under Review' || item.status === 'Action Required').length,
        selectionRate: percentage(selected, records.length),
        processingTime: times.length ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : 0,
      };
    });
    return [...entries].sort((first, second) => {
      if (schemeSort === 'selectionRate') return second.selectionRate - first.selectionRate;
      if (schemeSort === 'processingTime') return second.processingTime - first.processingTime;
      if (schemeSort === 'pending') return second.pending - first.pending;
      return second.applications - first.applications;
    });
  }, [managedSchemes, filteredApplications, selectedApplicationIds, schemeSort]);

  const stateRows = useMemo<StateRow[]>(() => {
    const grouped = new Map<string, AdminApplicationRecord[]>();
    for (const application of filteredApplications) {
      const group = grouped.get(application.state) ?? [];
      group.push(application);
      grouped.set(application.state, group);
    }
    return [...grouped.entries()].map(([state, records]) => {
      const verified = records.filter((item) => item.verificationStatus === 'Verified').length;
      const selected = records.filter((item) => selectedApplicationIds.has(item.applicationId)).length;
      const stateDeficiencyCount = records.reduce((total, item) =>
        total + (item.deficiencyIssueCount ?? (item.deficiencyStatus !== 'None' ? 1 : 0)), 0);
      return {
        state,
        applications: records.length,
        verified,
        pending: records.filter((item) => item.status === 'Under Review' || item.status === 'Action Required').length,
        deficiencies: stateDeficiencyCount,
        selected,
        deficiencyRatio: percentage(stateDeficiencyCount, records.length),
        selectionRatio: percentage(selected, records.length),
      };
    }).sort((first, second) => second.applications - first.applications);
  }, [filteredApplications, filteredDeficiencies, selectedApplicationIds]);

  const heatmapRows = useMemo<StateRow[]>(() => {
    const records = allApplications.filter((application) => {
      const submitted = normalizeDate(application.submittedDate);
      const matchesStage =
        stageFilter === 'All stages' ||
        (stageFilter === 'Verification' && application.currentStage === 'Verification') ||
        (stageFilter === 'Deficiency' && application.deficiencyStatus !== 'None') ||
        (stageFilter === 'Screening' && ['Scrutiny', 'Screening'].includes(application.currentStage)) ||
        (stageFilter === 'Selection' && (application.currentStage === 'Selection' || application.status === 'Selected' || application.status === 'Sanctioned' || selectionState[application.applicationId]?.selectionStatus === 'Selected' || selectionState[application.applicationId]?.sanctionStatus === 'Sanctioned')) ||
        (stageFilter === 'Sanction' && (application.status === 'Sanctioned' || selectionState[application.applicationId]?.sanctionStatus === 'Sanctioned'));
      return (academicYear === 'All academic years' || application.academicYear === academicYear) &&
        (schemeFilter === 'All schemes' || application.schemeId === schemeFilter) &&
        (statusFilter === 'All statuses' ||
          (statusFilter === 'Selected'
            ? application.status === 'Selected' || selectionState[application.applicationId]?.selectionStatus === 'Selected'
            : statusFilter === 'Sanctioned'
              ? application.status === 'Sanctioned' || selectionState[application.applicationId]?.sanctionStatus === 'Sanctioned'
              : application.status === statusFilter)) &&
        (!dateFrom || (submitted && submitted >= dateFrom)) &&
        (!dateTo || (submitted && submitted <= dateTo)) &&
        matchesStage;
    });
    const grouped = new Map<string, AdminApplicationRecord[]>();
    records.forEach((application) => {
      const group = grouped.get(application.state) ?? [];
      group.push(application);
      grouped.set(application.state, group);
    });
    return [...grouped.entries()].map(([state, items]) => {
      const selected = items.filter((item) => selectedApplicationIds.has(item.applicationId)).length;
      const deficiencies = items.reduce((total, item) =>
        total + (item.deficiencyIssueCount ?? (item.deficiencyStatus !== 'None' ? 1 : 0)), 0);
      return {
        state,
        applications: items.length,
        verified: items.filter((item) => item.verificationStatus === 'Verified').length,
        pending: items.filter((item) =>
          item.verificationStatus === 'Pending' ||
          item.verificationStatus === 'In Progress' ||
          item.verificationStatus === 'Discrepancy Flagged'
        ).length,
        deficiencies,
        selected,
        deficiencyRatio: percentage(deficiencies, items.length),
        selectionRatio: percentage(selected, items.length),
      };
    });
  }, [allApplications, academicYear, schemeFilter, statusFilter, dateFrom, dateTo, stageFilter, selectionState, selectedApplicationIds]);

  const aggregateGeoRows = useMemo(() => geographicData
    .filter((record) => stateFilter === 'All states / UTs' || record.state === stateFilter)
    .map((record) => ({
      state: record.state,
      applications: record.applicationCount,
      verified: Math.max(0, record.applicationCount - record.verificationPending),
      pending: record.verificationPending,
      deficiencies: record.deficiencyCount,
      selected: record.selectedCount,
      deficiencyRatio: percentage(record.deficiencyCount, record.applicationCount),
      selectionRatio: percentage(record.selectedCount, record.applicationCount),
    }))
    .sort((a, b) => b.applications - a.applications), [geographicData, stateFilter]);

  const trend = useMemo(() => createTrend(filteredApplications, interval, selectedApplicationIds), [filteredApplications, interval, selectedApplicationIds]);
  const deficiencyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of filteredDeficiencies) {
      let category: string = record.deficiencyType;
      if (category === 'Data Mismatch') category = 'Mismatch';
      if (category === 'Expired Certificate') category = 'Other';
      if (!deficiencyCategories.includes(category)) category = 'Other';
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return deficiencyCategories.map((category) => ({ category, count: counts.get(category) ?? 0 }));
  }, [filteredDeficiencies]);
  const selectedDeficiencies = selectedDeficiencyType
    ? filteredDeficiencies.filter((item) => {
        const category = item.deficiencyType === 'Data Mismatch' ? 'Mismatch'
          : item.deficiencyType === 'Expired Certificate' ? 'Other'
            : deficiencyCategories.includes(item.deficiencyType) ? item.deficiencyType : 'Other';
        return category === selectedDeficiencyType;
      })
    : [];

  const currentStageCount = (stageName: string): number => {
    switch (stageName) {
      case 'Applications Received': return baseFilteredApplications.length;
      case 'Verification':
        return baseFilteredApplications.filter((item) => workflowOrder.indexOf(item.currentStage) >= workflowOrder.indexOf('Verification')).length;
      case 'Deficiency':
        return baseFilteredApplications.filter((item) => item.deficiencyStatus !== 'None').length;
      case 'Screening':
        return baseFilteredApplications.filter((item) => ['Scrutiny', 'Screening', 'Selection', 'Disbursement'].includes(item.currentStage)).length;
      case 'Selection':
        return baseFilteredApplications.filter((item) => selectedApplicationIds.has(item.applicationId) || ['Selection', 'Disbursement'].includes(item.currentStage)).length;
      case 'Sanction':
        return baseFilteredApplications.filter((item) => selectionState[item.applicationId]?.sanctionStatus === 'Sanctioned' || item.status === 'Sanctioned').length;
      default: return 0;
    }
  };
  const stageQueueSizes: Record<string, number> = {
    Verification: baseFilteredApplications.filter((item) => item.currentStage === 'Verification').length,
    Deficiency: new Set(activeDeficiencies.map((item) => item.applicationId)).size,
    Screening: baseFilteredApplications.filter((item) => item.currentStage === 'Scrutiny' || item.currentStage === 'Screening').length,
    Selection: baseSelectionCases.filter((item) => item.approvalStatus === 'Pending Approval').length,
    Sanction: baseFilteredApplications.filter((item) => selectedApplicationIds.has(item.applicationId) && item.status !== 'Sanctioned' && selectionState[item.applicationId]?.sanctionStatus !== 'Sanctioned').length,
  };
  const pipeline = [
    { key: 'Applications Received', label: 'Applications Received' },
    { key: 'Verification', label: 'Verification' },
    { key: 'Deficiency', label: 'Deficiency' },
    { key: 'Screening', label: 'Screening' },
    { key: 'Selection', label: 'Selection' },
    { key: 'Sanction', label: 'Sanction' },
  ].map((stage, index, stages) => {
    const count = currentStageCount(stage.key);
    const previous = index === 0 ? count : currentStageCount(stages[index - 1].key);
    const progress = index === 0 ? 100 : percentage(count, previous);
    return { ...stage, count, progress, pending: stageQueueSizes[stage.key] ?? 0 };
  });
  const bottleneck = Object.entries(stageQueueSizes)
    .map(([label, count]) => ({ label, count }))
    .reduce((current, stage) => stage.count > current.count ? stage : current, { label: 'Verification', count: 0 });
  const processingStages = [
    { label: 'Submission → Verification', days: workflowStages.find((item) => item.stage === 'Submitted')?.avgDaysInStage ?? 1 },
    { label: 'Verification → Screening', days: workflowStages.find((item) => item.stage === 'Verification')?.avgDaysInStage ?? 4 },
    { label: 'Screening → Selection', days: workflowStages.find((item) => item.stage === 'Screening')?.avgDaysInStage ?? 5 },
    { label: 'Selection → Approval', days: workflowStages.find((item) => item.stage === 'Selection')?.avgDaysInStage ?? 3 },
    { label: 'Overall (registry elapsed)', days: averageProcessingDays },
  ];
  const fastestStage = [...processingStages.slice(0, 4)].sort((a, b) => a.days - b.days)[0];
  const slowestStage = [...processingStages.slice(0, 4)].sort((a, b) => b.days - a.days)[0];

  const visibleActivity = allActivity.filter((item) => applicationIds.has(item.applicationId));
  const reports = useMemo(() => reportDefinitions.map((definition) => reportFor(definition.title, {
    applications: filteredApplications,
    verifications: filteredVerifications,
    deficiencies: filteredDeficiencies,
    screening: baseScreening,
    selection: baseSelection,
    activity: visibleActivity,
    processingTimes,
    processingStages,
    stateRows,
    schemeRows,
  })), [filteredApplications, filteredVerifications, filteredDeficiencies, baseScreening, baseSelection, visibleActivity, processingTimes, processingStages, stateRows, schemeRows]);
  const selectedReport = reports.find((report) => report.title === activeReport);

  useEffect(() => {
    if (!activeReport) return;
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveReport(null);
    }
    window.addEventListener('keydown', closeWithEscape);
    return () => window.removeEventListener('keydown', closeWithEscape);
  }, [activeReport]);

  function changeStageFilter(stage: string) {
    if (stage === 'Applications Received') {
      setStageFilter('All stages');
      return;
    }
    setStageFilter(stage);
  }

  function exportCurrentReport() {
    const rows = toReportRows(filteredApplications, (item) => ({
      'Application ID': item.applicationId, Applicant: item.applicantName, Scheme: item.schemeName,
      'Academic Year': item.academicYear, State: item.state, District: item.district,
      Status: item.status, 'Verification Status': item.verificationStatus, Stage: item.currentStage,
      'Submitted Date': item.submittedDate, 'Last Action Date': item.lastActionDate,
    }));
    downloadCsv('mota-analytics-filtered-applications-demo.csv', rows);
  }

  return (
    <section className="space-y-5 text-[#172033]">
      <header className="flex flex-col gap-4 border-b border-[#DCE3EC] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#64748B]">Administration / Reports</span>
            <span className="border border-[#D6E1EF] bg-[#EEF4FB] px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] text-[#173F7A]">DEMO ANALYTICS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Analytics &amp; Reports</h1>
          <p className="mt-1 max-w-3xl text-sm text-[#64748B]">Monitor scholarship application trends, processing performance, verification outcomes, selection progress, and scheme-level insights.</p>
        </div>
        <button type="button" onClick={exportCurrentReport} disabled={!filteredApplications.length} className="inline-flex min-h-10 items-center justify-center gap-2 self-start bg-[#173F7A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8] disabled:cursor-not-allowed disabled:opacity-50">
          <ArrowDownToLine size={16} aria-hidden="true" /> Export Report (CSV)
        </button>
      </header>

      <div className="border border-[#DCE3EC] bg-white">
        <div className="flex items-center justify-between border-b border-[#DCE3EC] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Filter size={16} className="text-[#173F7A]" aria-hidden="true" /> Report filters</div>
          <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-[#173F7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] md:hidden">{filtersOpen ? 'Hide filters' : 'Show filters'}<ChevronDown size={14} /></button>
          <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); setAcademicYear('All academic years'); setSchemeFilter('All schemes'); setStateFilter('All states / UTs'); setStatusFilter('All statuses'); setStageFilter('All stages'); }} className="hidden text-xs font-semibold text-[#173F7A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] md:inline">Reset filters</button>
        </div>
        <div className={`${filtersOpen ? 'grid' : 'hidden'} grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid`}>
          <Field label="Date from"><input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className={filterInput} /></Field>
          <Field label="Date to"><input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className={filterInput} /></Field>
          <Field label="Academic year"><select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className={filterInput}><option>All academic years</option>{academicYears.map((year) => <option key={year}>{year}</option>)}</select></Field>
          <Field label="Scheme"><select value={schemeFilter} onChange={(event) => setSchemeFilter(event.target.value)} className={filterInput}><option value="All schemes">All schemes</option>{managedSchemes.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.name}</option>)}</select></Field>
          <Field label="State / UT"><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className={filterInput}><option>All states / UTs</option>{states.map((state) => <option key={state}>{state}</option>)}</select></Field>
          <Field label="Application status"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={filterInput}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E9EEF4] bg-[#FAFBFD] px-4 py-2 text-xs text-[#64748B]">
          <span>{filteredApplications.length} of {allApplications.length} application records · Demo / illustrative data</span>
          <div className="flex flex-wrap items-center gap-3">
            {stageFilter !== 'All stages' && <button type="button" onClick={() => setStageFilter('All stages')} className="font-semibold text-[#173F7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Workflow: {stageFilter} ×</button>}
            <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); setAcademicYear('All academic years'); setSchemeFilter('All schemes'); setStateFilter('All states / UTs'); setStatusFilter('All statuses'); setStageFilter('All stages'); }} className="md:hidden font-semibold text-[#173F7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Reset filters</button>
          </div>
        </div>
      </div>

      {storageNotice && <p role="status" className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{storageNotice}</p>}

      <section aria-labelledby="analytics-kpi-title">
        <div className="mb-2 flex items-center justify-between"><h2 id="analytics-kpi-title" className="text-sm font-bold">Key performance indicators</h2><span className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Illustrative record-level metrics</span></div>
        <div className="grid grid-cols-2 border border-[#DCE3EC] bg-white sm:grid-cols-4 xl:grid-cols-8">
          <Kpi label="Total Applications" value={filteredApplications.length} support="Filtered application records" icon={Users} />
          <Kpi label="Under Review" value={underReviewCount} support={`${percentage(underReviewCount, filteredApplications.length)}% of filtered records`} icon={Clock3} />
          <Kpi label="Verified Applications" value={verifiedCount} support={`${percentage(verifiedCount, filteredApplications.length)}% verification status`} icon={ShieldCheck} />
          <Kpi label="Deficiencies Raised" value={filteredDeficiencies.length} support={`${activeDeficiencies.length} currently open`} icon={AlertTriangle} />
          <Kpi label="Selected Applicants" value={selectedCount} support={`${selectionRate}% of filtered records`} icon={CheckCircle2} />
          <Kpi label="Pending Approvals" value={pendingApprovalCount} support="Selection workflow state" icon={FileBarChart2} />
          <Kpi label="Avg. Processing Time" value={`${averageProcessingDays}d`} support="Submission → last recorded action" icon={Activity} />
          <Kpi label="Selection Rate" value={`${selectionRate}%`} support={`${selectedCount} selected / sanctioned`} icon={BarChart3} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <section aria-labelledby="trend-title" className="border border-[#DCE3EC] bg-white p-4 xl:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 id="trend-title" className="text-base font-bold">Application Volume Trend</h2><p className="mt-1 text-xs text-[#64748B]">Received, verified and selected records by submission date.</p></div>
            <div role="group" aria-label="Trend interval" className="flex border border-[#DCE3EC]">
              {(['daily', 'weekly', 'monthly'] as const).map((option) => <button key={option} type="button" aria-pressed={interval === option} onClick={() => setInterval(option)} className={`min-h-8 px-2.5 text-xs font-semibold capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] ${interval === option ? 'bg-[#173F7A] text-white' : 'bg-white text-[#475569] hover:bg-[#F6F8FB]'}`}>{option}</button>)}
            </div>
          </div>
          <div className="mt-4">
            {trend.length ? <TrendChart data={trend} /> : <EmptyState text="No application records in the selected date range." />}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#475569]">
            <Legend color="#173F7A" label="Applications Received" />
            <Legend color="#16805B" label="Applications Verified" />
            <Legend color="#B7791F" label="Applications Selected" />
          </div>
          <p className="mt-2 text-[10px] text-[#64748B]">Illustrative registry records only; dates represent the demo dataset.</p>
        </section>

        <section aria-labelledby="pipeline-title" className="border border-[#DCE3EC] bg-white p-4 xl:col-span-2">
          <div className="mb-1 flex items-start justify-between gap-2"><div><h2 id="pipeline-title" className="text-base font-bold">Application Pipeline</h2><p className="mt-1 text-xs text-[#64748B]">Records by workflow stage; deficiency cases may overlap with other stages.</p></div><span className="shrink-0 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">Bottleneck: {bottleneck?.label ?? '—'}</span></div>
          <ol className="mt-4 space-y-2">
            {pipeline.map((stage, index) => (
              <li key={stage.key} className="relative">
                <button type="button" onClick={() => changeStageFilter(stage.key)} className={`group flex w-full items-center gap-3 border p-2.5 text-left hover:bg-[#FAFBFD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] ${bottleneck.label === stage.key ? 'border-amber-300 bg-amber-50/50 hover:border-amber-400' : 'border-[#E4EAF1] hover:border-[#B7C8DB]'}`} aria-label={`Filter dashboard to ${stage.label}; ${stage.count} stage records, ${stage.pending} pending`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#EEF4FB] text-xs font-bold text-[#173F7A]">{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{stage.label}{bottleneck.label === stage.key && <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">Bottleneck</span>}</span><span className="mt-1 block h-1.5 bg-[#EEF2F6]"><span className="block h-full bg-[#2563A8]" style={{ width: `${filteredApplications.length ? Math.min(100, Math.max(0, (stage.count / filteredApplications.length) * 100)) : 0}%` }} /></span></span>
                  <span className="shrink-0 text-right"><span className="block text-sm font-bold tabular-nums">{stage.count}</span><span className="block text-[10px] text-[#64748B]">{stage.progress}% of prior · {stage.pending} pending</span></span>
                  {index < pipeline.length - 1 && <ArrowRight size={14} className="hidden text-[#94A3B8] sm:block" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[10px] text-[#64748B]">*Illustrative stage-to-stage record ratio; stages are not a mutually exclusive cohort.</p>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section aria-labelledby="verification-title" className="border border-[#DCE3EC] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 id="verification-title" className="text-base font-bold">Verification &amp; Deficiency Analytics</h2><p className="mt-1 text-xs text-[#64748B]">Counts use the existing demo module records. Scheme, state and date filters apply directly; application status applies when a source record links to an application.</p></div><a href="/admin/verification" className="text-xs font-semibold text-[#173F7A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Open verification queue <ArrowRight className="inline" size={13} /></a></div>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748B]">Verification outcomes</h3>
              <Outcome label="Verified" count={verifiedDocuments} total={filteredVerifications.length} color="bg-emerald-600" />
              <Outcome label="Needs Review" count={reviewDocuments} total={filteredVerifications.length} color="bg-blue-700" />
              <Outcome label="Flagged" count={flaggedDocuments} total={filteredVerifications.length} color="bg-rose-600" />
              <Outcome label="Pending" count={pendingDocuments} total={filteredVerifications.length} color="bg-amber-600" />
              <p className="mt-2 text-[10px] text-[#64748B]">{filteredVerifications.length} linked demo verification records</p>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748B]">Deficiency analysis</h3>
              <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                <SmallMetric label="Total" value={filteredDeficiencies.length} />
                <SmallMetric label="Open" value={activeDeficiencies.length} />
                <SmallMetric label="Resolved" value={filteredDeficiencies.filter((item) => item.status === 'Resolved').length} />
                <SmallMetric label="Overdue" value={overdueDeficiencies.length} warning={overdueDeficiencies.length > 0} />
              </div>
              <div className="space-y-1">
                {deficiencyCounts.map(({ category, count }) => <button key={category} type="button" onClick={() => setSelectedDeficiencyType(selectedDeficiencyType === category ? null : category)} aria-pressed={selectedDeficiencyType === category} className={`flex min-h-7 w-full items-center justify-between gap-2 px-2 text-left text-xs hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] ${selectedDeficiencyType === category ? 'bg-[#EEF4FB] font-semibold text-[#173F7A]' : 'text-[#475569]'}`}><span>{category}</span><span className="tabular-nums">{count}</span></button>)}
              </div>
            </div>
          </div>
          {selectedDeficiencyType && <div className="mt-4 border-t border-[#DCE3EC] pt-3">
            <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold">{selectedDeficiencyType} · {selectedDeficiencies.length} records</h3><button type="button" aria-label="Clear selected deficiency category" onClick={() => setSelectedDeficiencyType(null)} className="rounded p-1 text-[#64748B] hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><X size={14} /></button></div>
            {selectedDeficiencies.length ? <ul className="space-y-1 text-xs">{selectedDeficiencies.map((record) => <li key={record.id} className="flex flex-wrap justify-between gap-1 border-b border-[#EEF2F6] py-1.5"><a className="font-semibold text-[#173F7A] hover:underline" href={`/admin/deficiencies?applicationId=${encodeURIComponent(record.applicationId)}`}>{record.applicationId}</a><span>{record.applicantName} · {record.state} · {record.status}</span></li>)}</ul> : <p className="text-xs text-[#64748B]">No records in this category for the current filters.</p>}
          </div>}
        </section>

        <section aria-labelledby="screen-selection-title" className="border border-[#DCE3EC] bg-white p-4">
          <div><h2 id="screen-selection-title" className="text-base font-bold">Screening &amp; Selection Insights</h2><p className="mt-1 text-xs text-[#64748B]">AI-assisted assessment supports review; final decisions remain with authorized officials.</p></div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Screening</h3><a href="/admin/screening" className="text-[11px] font-semibold text-[#173F7A] hover:underline">Open queue</a></div>
              {[
                ['Preliminary matches', baseScreening.filter((item) => item.screeningStatus === 'Preliminary Match').length],
                ['Criteria not met', baseScreening.filter((item) => item.screeningStatus === 'Criteria Not Met').length],
                ['Missing information', baseScreening.filter((item) => item.screeningStatus === 'Missing Information').length],
                ['Borderline / exception', baseScreening.filter((item) => item.screeningStatus === 'Borderline / Exception').length],
                ['Pending official review', baseScreening.filter((item) => item.officialReviewStatus === 'Pending').length],
              ].map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-[#EEF2F6] py-2 text-xs"><span>{label}</span><span className="font-semibold tabular-nums">{value}</span></div>)}
              <p className="mt-2 text-[10px] text-[#64748B]">Preliminary assessments are not official eligibility decisions.</p>
            </div>
            <div><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Selection</h3><a href="/admin/selection" className="text-[11px] font-semibold text-[#173F7A] hover:underline">Open queue</a></div>
              {[
                ['Recommended', baseSelection.filter((item) => item.selectionStatus === 'Recommended').length],
                ['Waitlisted', baseSelection.filter((item) => item.selectionStatus === 'Waitlisted').length],
                ['Selected', baseSelection.filter((item) => item.selectionStatus === 'Selected').length],
                ['Not recommended', baseSelection.filter((item) => item.selectionStatus === 'Not Recommended').length],
                ['Pending approval', baseSelection.filter((item) => item.approvalStatus === 'Pending Approval').length],
              ].map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-[#EEF2F6] py-2 text-xs"><span>{label}</span><span className="font-semibold tabular-nums">{value}</span></div>)}
              <p className="mt-2 text-[10px] text-[#64748B]">Official selection decision remains with authorized officials.</p>
            </div>
          </div>
        </section>
      </div>

      <section aria-labelledby="scheme-performance-title" className="border border-[#DCE3EC] bg-white">
        <div className="flex flex-col gap-2 border-b border-[#DCE3EC] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 id="scheme-performance-title" className="text-base font-bold">Scheme Performance</h2><p className="mt-1 text-xs text-[#64748B]">Calculated from filtered applications; schemes with no matching records remain visible.</p></div>
          <Field label="Sort schemes"><select value={schemeSort} onChange={(event) => setSchemeSort(event.target.value as SortKey)} className={`${filterInput} mt-0 min-h-9 w-full sm:w-56`}><option value="applications">Applications</option><option value="selectionRate">Selection rate</option><option value="processingTime">Processing time</option><option value="pending">Pending applications</option></select></Field>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-[#F4F7FA] uppercase tracking-wide text-[#64748B]"><tr>{['Scheme', 'Applications', 'Verified', 'Selected', 'Pending', 'Selection rate', 'Avg. processing'].map((label) => <th key={label} scope="col" className="border-b border-[#DCE3EC] px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
            <tbody>{schemeRows.map((row) => <tr key={row.id} className="border-b border-[#EEF2F6] last:border-0 hover:bg-[#FAFBFD]">
              <td className="px-4 py-3"><button type="button" onClick={() => setSchemeFilter(row.id)} className="text-left font-semibold text-[#173F7A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">{row.name}</button></td>
              <td className="px-4 py-3 tabular-nums">{row.applications}</td><td className="px-4 py-3 tabular-nums">{row.verified}</td><td className="px-4 py-3 tabular-nums">{row.selected}</td><td className="px-4 py-3 tabular-nums">{row.pending}</td><td className="px-4 py-3 tabular-nums">{row.selectionRate}%</td><td className="px-4 py-3 tabular-nums">{row.applications ? `${row.processingTime} days` : '—'}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="divide-y divide-[#EEF2F6] md:hidden">{schemeRows.map((row) => <article key={row.id} className="p-4">
          <button type="button" onClick={() => setSchemeFilter(row.id)} className="text-left text-sm font-bold text-[#173F7A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">{row.name}</button>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">{[['Applications', row.applications], ['Verified', row.verified], ['Selected', row.selected], ['Pending', row.pending], ['Selection rate', `${row.selectionRate}%`], ['Avg. processing', row.applications ? `${row.processingTime} days` : '—']].map(([label, value]) => <div key={label}><dt className="text-[#64748B]">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>
        </article>)}</div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section aria-labelledby="state-distribution-title" className="border border-[#DCE3EC] bg-white p-4">
          <div className="flex items-start justify-between gap-2"><div><h2 id="state-distribution-title" className="text-base font-bold">State-wise Application Distribution</h2><p className="mt-1 text-xs text-[#64748B]">Ranked view from application records; select a state to filter this dashboard.</p></div><MapPin size={17} className="text-[#173F7A]" aria-hidden="true" /></div>
          <StateBars rows={stateRows} selectedState={stateFilter} onSelect={setStateFilter} />
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-[#64748B]"><tr>{['State / UT', 'Applications', 'Verified', 'Pending', 'Deficiencies', 'Selected'].map((label) => <th key={label} scope="col" className="border-b border-[#DCE3EC] px-2 py-2 font-semibold">{label}</th>)}</tr></thead>
              <tbody>{stateRows.map((row) => <tr key={row.state} className="border-b border-[#EEF2F6] last:border-0">
                <td className="px-2 py-2"><button type="button" onClick={() => setStateFilter(row.state)} className="font-semibold text-[#173F7A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">{row.state}</button></td>
                {[row.applications, row.verified, row.pending, row.deficiencies, row.selected].map((value, index) => <td key={`${row.state}-${index}`} className="px-2 py-2 tabular-nums">{value}</td>)}
              </tr>)}</tbody>
            </table>
            {!stateRows.length && <EmptyState text="No states match the selected filters." />}
          </div>
          <div className="mt-3 divide-y divide-[#EEF2F6] md:hidden">
            {stateRows.map((row) => <article key={row.state} className="py-3">
              <button type="button" onClick={() => setStateFilter(row.state)} className="text-left text-sm font-semibold text-[#173F7A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">{row.state}</button>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">{[['Applications', row.applications], ['Verified', row.verified], ['Pending', row.pending], ['Deficiencies', row.deficiencies], ['Selected', row.selected]].map(([label, value]) => <div key={label}><dt className="text-[#64748B]">{label}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>)}</dl>
            </article>)}
            {!stateRows.length && <EmptyState text="No states match the selected filters." />}
          </div>
        </section>

        <section aria-labelledby="geo-coverage-title" className="border border-[#DCE3EC] bg-white p-4">
          <div><h2 id="geo-coverage-title" className="text-base font-bold">Geographical Application Density &amp; Tribal Coverage</h2><p className="mt-1 text-xs text-[#64748B]">Aggregated/demo geographic indicators from the existing admin dataset; not a measure of tribal population coverage.</p></div>
          <IndiaHeatmap
            rows={heatmapRows}
            selectedState={stateFilter}
            onSelect={setStateFilter}
            onClear={() => setStateFilter('All states / UTs')}
          />
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead className="bg-[#F4F7FA] text-[10px] uppercase tracking-wide text-[#64748B]"><tr>{['State / UT', 'Applications', 'Selected', 'Verification pending', 'Deficiency ratio', 'Selection ratio', 'Signals'].map((label) => <th key={label} scope="col" className="border-b border-[#DCE3EC] px-2 py-2.5 font-semibold">{label}</th>)}</tr></thead>
              <tbody>{aggregateGeoRows.map((row) => {
                const maxApplications = Math.max(1, ...aggregateGeoRows.map((item) => item.applications));
                const maxPending = Math.max(1, ...aggregateGeoRows.map((item) => item.pending));
                const signals = [
                  ...(row.applications >= Math.ceil(maxApplications * 0.7) ? ['High volume'] : []),
                  ...(row.pending >= Math.ceil(maxPending * 0.7) ? ['Verification pending'] : []),
                  ...(row.deficiencyRatio >= 15 && row.applications > 0 ? ['Deficiency ratio'] : []),
                  ...(row.applications >= 2 && row.selectionRatio < 10 ? ['Low selection ratio'] : []),
                ];
                return <tr key={row.state} className="border-b border-[#EEF2F6] last:border-0">
                  <td className="px-2 py-2 font-semibold">{row.state}</td><td className="px-2 py-2 tabular-nums">{row.applications}</td><td className="px-2 py-2 tabular-nums">{row.selected}</td><td className="px-2 py-2 tabular-nums">{row.pending}</td><td className="px-2 py-2 tabular-nums">{row.deficiencyRatio}%</td><td className="px-2 py-2 tabular-nums">{row.selectionRatio}%</td>
                  <td className="px-2 py-2">{signals.length ? <span className="text-amber-800">{signals.join(', ')}</span> : <span className="text-[#64748B]">—</span>}</td>
                </tr>;
              })}</tbody>
            </table>
            {!aggregateGeoRows.length && <EmptyState text="No geographic records match the selected state." />}
          </div>
          <div className="mt-3 divide-y divide-[#EEF2F6] md:hidden">
            {aggregateGeoRows.map((row) => {
              const maxApplications = Math.max(1, ...aggregateGeoRows.map((item) => item.applications));
              const maxPending = Math.max(1, ...aggregateGeoRows.map((item) => item.pending));
              const signals = [
                ...(row.applications >= Math.ceil(maxApplications * 0.7) ? ['High volume'] : []),
                ...(row.pending >= Math.ceil(maxPending * 0.7) ? ['Verification pending'] : []),
                ...(row.deficiencyRatio >= 15 && row.applications > 0 ? ['Deficiency ratio'] : []),
                ...(row.applications >= 2 && row.selectionRatio < 10 ? ['Low selection ratio'] : []),
              ];
              return <article key={row.state} className="py-3">
                <button type="button" onClick={() => setStateFilter(row.state)} className="text-left text-sm font-semibold text-[#173F7A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">{row.state}</button>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">{[['Applications', row.applications], ['Selected', row.selected], ['Verification pending', row.pending], ['Deficiency ratio', `${row.deficiencyRatio}%`], ['Selection ratio', `${row.selectionRatio}%`]].map(([label, value]) => <div key={label}><dt className="text-[#64748B]">{label}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>)}</dl>
                <p className="mt-2 text-xs text-amber-800"><span className="font-semibold">Signals:</span> {signals.length ? signals.join(', ') : 'No threshold flag'}</p>
              </article>;
            })}
            {!aggregateGeoRows.length && <EmptyState text="No geographic records match the selected state." />}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#64748B]">This pre-aggregated geographic sample responds to the state filter; it is not recalculated for date, academic year, scheme or application-status filters. For those filters use the record-level state distribution above.</p>
        </section>
      </div>

      <section aria-labelledby="processing-title" className="border border-[#DCE3EC] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="processing-title" className="text-base font-bold">Processing Performance</h2><p className="mt-1 text-xs text-[#64748B]">Stage averages use existing workflow demo metrics; overall elapsed time is calculated from application dates.</p></div><span className="border border-[#DCE3EC] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#475569]">Current bottleneck indicator: {bottleneck?.label ?? '—'}</span></div>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="space-y-3" aria-label="Processing time by stage in days">
            {processingStages.map((stage) => <div key={stage.label} className="grid grid-cols-[minmax(125px,1fr)_3fr_40px] items-center gap-2 text-xs">
              <span className="text-[#475569]">{stage.label}</span><span className="h-2 bg-[#EEF2F6]"><span className={`block h-full ${stage.days === slowestStage?.days ? 'bg-[#B7791F]' : 'bg-[#2563A8]'}`} style={{ width: `${Math.max(2, Math.min(100, (stage.days / Math.max(1, ...processingStages.map((item) => item.days))) * 100))}%` }} /></span><span className="text-right font-bold tabular-nums">{stage.days}d</span>
            </div>)}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <SmallMetric label="Fastest stage" value={`${fastestStage?.label ?? '—'} · ${fastestStage?.days ?? 0}d`} />
            <SmallMetric label="Slowest stage" value={`${slowestStage?.label ?? '—'} · ${slowestStage?.days ?? 0}d`} warning />
            <SmallMetric label="Largest current queue" value={`${bottleneck?.label ?? '—'} · ${bottleneck?.count ?? 0}`} warning />
            <p className="text-[10px] leading-4 text-[#64748B] sm:col-span-3">Submission → last recorded action is a registry elapsed-time proxy and should not be interpreted as a service-level commitment.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="reports-title">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 id="reports-title" className="text-base font-bold">Reports</h2><p className="mt-1 text-xs text-[#64748B]">Reports are generated in-browser from the currently filtered demo records.</p></div><span className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">CSV exports include demo label</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => <article key={report.title} className="flex flex-col border border-[#DCE3EC] bg-white p-4">
            <div className="flex items-start gap-2"><FileBarChart2 size={17} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" /><div><h3 className="text-sm font-bold">{report.title}</h3><p className="mt-1 min-h-[34px] text-xs leading-5 text-[#64748B]">{report.description}</p></div></div>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <button type="button" onClick={() => setActiveReport(report.title)} className="inline-flex min-h-9 items-center gap-1.5 border border-[#173F7A] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F2F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><Search size={13} /> View Report</button>
              <button type="button" disabled={!report.rows.length} onClick={() => downloadCsv(`mota-${report.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-demo.csv`, report.rows)} className="inline-flex min-h-9 items-center gap-1.5 border border-[#DCE3EC] px-3 text-xs font-semibold text-[#475569] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] disabled:cursor-not-allowed disabled:opacity-50"><ArrowDownToLine size={13} /> Export CSV</button>
            </div>
            <span className="mt-2 text-[10px] text-[#64748B]">{report.rows.length} filtered records</span>
          </article>)}
        </div>
      </section>

      <footer className="border border-[#DCE3EC] bg-white px-4 py-3 text-xs leading-5 text-[#64748B]">
        <strong className="text-[#172033]">Administrative simulation and demonstration environment.</strong> Figures and records are illustrative and are not official Ministry statistics. AI-assisted assessments and merit recommendations support scrutiny only; final eligibility and selection remain with authorized officials.
      </footer>

      {selectedReport && <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-950/40 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveReport(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" className="flex max-h-full w-full flex-col bg-white shadow-xl sm:max-h-[90vh] sm:max-w-5xl">
          <header className="flex items-start justify-between gap-3 border-b border-[#DCE3EC] px-4 py-4 sm:px-6">
            <div><span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">Demo report · {selectedReport.rows.length} records</span><h2 id="report-dialog-title" className="mt-1 text-lg font-bold">{selectedReport.title}</h2><p className="mt-1 text-xs text-[#64748B]">{selectedReport.description}</p></div>
            <button type="button" aria-label="Close report" onClick={() => setActiveReport(null)} className="rounded p-1 text-[#64748B] hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><X size={19} /></button>
          </header>
          <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
            {selectedReport.rows.length ? <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="sticky top-0 bg-[#F4F7FA] text-[10px] uppercase tracking-wide text-[#64748B]"><tr>{Object.keys(selectedReport.rows[0]).map((key) => <th key={key} scope="col" className="border-b border-[#DCE3EC] px-3 py-2.5 font-semibold">{key}</th>)}</tr></thead>
              <tbody>{selectedReport.rows.map((row, index) => <tr key={index} className="border-b border-[#EEF2F6] last:border-0">{Object.entries(row).map(([key, value]) => <td key={key} className="max-w-[260px] px-3 py-2.5 text-[#334155]">{String(value)}</td>)}</tr>)}</tbody>
            </table> : <EmptyState text="There are no records for this report under the selected filters." />}
          </div>
          <footer className="flex flex-wrap justify-end gap-2 border-t border-[#DCE3EC] px-4 py-3 sm:px-6">
            <button type="button" onClick={() => setActiveReport(null)} className="min-h-9 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Close</button>
            <button type="button" disabled={!selectedReport.rows.length} onClick={() => downloadCsv(`mota-${selectedReport.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-demo.csv`, selectedReport.rows)} className="inline-flex min-h-9 items-center gap-1.5 bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] disabled:opacity-50"><ArrowDownToLine size={13} /> Export CSV</button>
          </footer>
        </section>
      </div>}
    </section>
  );
}

const filterInput = 'mt-1 min-h-10 w-full border border-[#C9D4E2] bg-white px-3 py-2 text-sm text-[#172033] outline-none focus:border-[#2563A8] focus:ring-1 focus:ring-[#2563A8]';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-semibold text-[#334155]">{label}{children}</label>;
}

function Kpi({ label, value, support, icon: Icon }: { label: string; value: string | number; support: string; icon: typeof Users }) {
  return <article className="min-h-[102px] border-b border-r border-[#DCE3EC] p-3 last:border-r-0 sm:p-3.5">
    <div className="flex items-start justify-between gap-1"><span className="text-[11px] font-medium leading-4 text-[#64748B]">{label}</span><Icon size={15} className="shrink-0 text-[#173F7A]" aria-hidden="true" /></div>
    <div className="mt-2 text-xl font-bold tabular-nums text-[#172033]">{value}</div><div className="mt-1 text-[10px] leading-4 text-[#64748B]">{support}</div>
  </article>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2" style={{ backgroundColor: color }} />{label}</span>;
}

function TrendChart({ data }: { data: TrendRow[] }) {
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => setChartReady(true), []);
  const width = 720;
  const height = 235;
  const left = 34;
  const right = 12;
  const top = 12;
  const bottom = 34;
  const maxValue = Math.max(1, ...data.flatMap((item) => [item.received, item.verified, item.selected]));
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const point = (value: number, index: number) => ({
    x: left + (data.length <= 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth),
    y: top + chartHeight - (value / maxValue) * chartHeight,
  });
  const path = (key: keyof Omit<TrendRow, 'label'>) => data.map((item, index) => {
    const { x, y } = point(item[key], index);
    return `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const tickCount = 4;
  if (!chartReady) {
    return <div role="img" aria-label="Loading application volume trend chart" className="min-h-[235px] w-full" />;
  }
  return <div className="w-full overflow-hidden">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="trend-svg-title trend-svg-desc" className="block w-full">
      <title id="trend-svg-title">Application volume by time</title>
      <desc id="trend-svg-desc">Line chart comparing applications received, verified, and selected across {data.length} date buckets from filtered illustrative records.</desc>
      {Array.from({ length: tickCount + 1 }, (_, index) => {
        const y = top + (chartHeight / tickCount) * index;
        const value = Math.round(maxValue - (maxValue / tickCount) * index);
        return <g key={index}><line x1={left} x2={width - right} y1={y} y2={y} stroke="#E7EDF3" strokeWidth="1" /><text x={left - 8} y={y + 3} textAnchor="end" fill="#64748B" fontSize="10">{value}</text></g>;
      })}
      <path d={path('received')} fill="none" stroke="#173F7A" strokeWidth="2.5" />
      <path d={path('verified')} fill="none" stroke="#16805B" strokeWidth="2.5" />
      <path d={path('selected')} fill="none" stroke="#B7791F" strokeWidth="2.5" />
      {data.map((row, index) => {
        const receivePoint = point(row.received, index);
        const verifiedPoint = point(row.verified, index);
        const selectedPoint = point(row.selected, index);
        return <g key={`${row.label}-${index}`}>
          <circle cx={receivePoint.x} cy={receivePoint.y} r="3.3" fill="#173F7A"><title>{row.label}: {row.received} applications received</title></circle>
          <circle cx={verifiedPoint.x} cy={verifiedPoint.y} r="3.3" fill="#16805B"><title>{row.label}: {row.verified} verified</title></circle>
          <circle cx={selectedPoint.x} cy={selectedPoint.y} r="3.3" fill="#B7791F"><title>{row.label}: {row.selected} selected</title></circle>
          {(data.length <= 10 || index % Math.ceil(data.length / 8) === 0 || index === data.length - 1) && <text x={receivePoint.x} y={height - 10} textAnchor="middle" fill="#64748B" fontSize="9">{row.label}</text>}
        </g>;
      })}
    </svg>
  </div>;
}

function Outcome({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const ratio = percentage(count, total);
  return <div className="mb-3">
    <div className="mb-1 flex items-center justify-between gap-2 text-xs"><span>{label}</span><span className="font-semibold tabular-nums">{count} <span className="font-normal text-[#64748B]">({ratio}%)</span></span></div>
    <div className="h-1.5 bg-[#EEF2F6]" role="progressbar" aria-label={`${label} share`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ratio}><div className={`h-full ${color}`} style={{ width: `${ratio}%` }} /></div>
  </div>;
}

function SmallMetric({ label, value, warning = false }: { label: string; value: string | number; warning?: boolean }) {
  return <div className={`border p-2.5 ${warning ? 'border-amber-200 bg-amber-50' : 'border-[#E5EAF0] bg-[#FAFBFD]'}`}><div className="text-[10px] text-[#64748B]">{label}</div><div className={`mt-1 break-words text-sm font-bold ${warning ? 'text-amber-900' : 'text-[#172033]'}`}>{value}</div></div>;
}

function StateBars({ rows, selectedState, onSelect }: { rows: StateRow[]; selectedState: string; onSelect: (state: string) => void }) {
  const max = Math.max(1, ...rows.map((row) => row.applications));
  return <ul className="mt-4 space-y-2">
    {rows.slice(0, 8).map((row) => <li key={row.state}>
      <button type="button" onClick={() => onSelect(selectedState === row.state ? 'All states / UTs' : row.state)} aria-pressed={selectedState === row.state} className="grid w-full grid-cols-[105px_minmax(40px,1fr)_34px] items-center gap-2 text-left text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
        <span className={`truncate ${selectedState === row.state ? 'font-bold text-[#173F7A]' : 'text-[#475569]'}`}>{row.state}</span>
        <span className="h-2 bg-[#EEF2F6]"><span className="block h-full bg-[#2563A8]" style={{ width: `${Math.max(2, row.applications / max * 100)}%` }} /></span>
        <span className="text-right font-semibold tabular-nums">{row.applications}</span>
      </button>
    </li>)}
    {!rows.length && <li><EmptyState text="No state data for the selected filters." /></li>}
  </ul>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="border border-dashed border-[#DCE3EC] px-4 py-6 text-center text-xs text-[#64748B]">{text}</div>;
}
