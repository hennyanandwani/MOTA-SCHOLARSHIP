import type { AdminApplicationRecord } from '@/lib/adminData';
import type { EligibilityRule } from '@/lib/adminRuleData';
import type { Scheme } from '@/lib/schemes';

export const AUDIT_MODULES = [
  'Applications',
  'Verification',
  'Deficiencies',
  'Screening',
  'Selection',
  'Schemes',
  'Rules',
  'Communications',
  'Authentication',
  'System',
] as const;
export type AuditModule = (typeof AUDIT_MODULES)[number];

export const AUDIT_SEVERITIES = ['Info', 'Low', 'Medium', 'High', 'Critical'] as const;
export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

export const AUDIT_ACTION_TYPES = [
  'Workflow',
  'Configuration',
  'Communication',
  'Security',
  'Official Override',
] as const;
export type AuditActionType = (typeof AUDIT_ACTION_TYPES)[number];

export type AuditTimelineEntry = {
  id: string;
  timestamp: string;
  description: string;
};

export type AuditSecurityMetadata = {
  ipAddress?: string;
  sessionId?: string;
  deviceBrowser?: string;
  authenticationResult?: 'Success' | 'Failure' | 'Not applicable';
  securityEventType?: string;
};

export type AuditOverrideMetadata = {
  reason: string;
  reviewStatus: 'Pending secondary review' | 'Reviewed';
};

export type AuditConfigurationMetadata = {
  ruleId?: string;
  schemeId?: string;
  schemeName?: string;
  changedField: string;
  previousValue: string;
  newValue: string;
};

export type AdminAuditEvent = {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  actionType: AuditActionType;
  module: AuditModule;
  referenceId?: string;
  applicationId?: string;
  schemeId?: string;
  schemeName?: string;
  relatedRecord?: string;
  previousState?: string;
  newState?: string;
  severity: AuditSeverity;
  security?: AuditSecurityMetadata;
  override?: AuditOverrideMetadata;
  configuration?: AuditConfigurationMetadata;
  activity: AuditTimelineEntry[];
  isDemo: true;
};

export const ADMIN_AUDIT_STORAGE_KEY = 'mota_admin_audit_state';

type AuditSeedContext = {
  applications: AdminApplicationRecord[];
  schemes: Pick<Scheme, 'id' | 'name'>[];
  rules: EligibilityRule[];
};

function shiftTimestamp(timestamp: string, minutes: number): string {
  return new Date(new Date(timestamp).getTime() + minutes * 60_000).toISOString();
}

function createEvent(
  event: Omit<AdminAuditEvent, 'activity' | 'isDemo'>,
): AdminAuditEvent {
  return {
    ...event,
    isDemo: true,
    activity: [
      {
        id: `${event.id}-created`,
        timestamp: shiftTimestamp(event.timestamp, -1),
        description: 'Demo audit entry prepared.',
      },
      {
        id: `${event.id}-action`,
        timestamp: event.timestamp,
        description: `${event.userName} recorded: ${event.action}.`,
      },
    ],
  };
}

export function createInitialAuditEvents({
  applications,
  schemes,
  rules,
}: AuditSeedContext): AdminAuditEvent[] {
  const application = applications[0];
  const secondApplication = applications[1] ?? application;
  const selectedApplication = applications.find((item) => item.status === 'Selected') ?? applications[2] ?? application;
  const scheme = schemes.find((item) => item.id === application?.schemeId) ?? schemes[0];
  const rule = rules.find((item) => item.schemeId === scheme?.id);
  const applicationId = application?.applicationId ?? 'APP-DEMO-001';
  const secondApplicationId = secondApplication?.applicationId ?? applicationId;
  const selectedApplicationId = selectedApplication?.applicationId ?? applicationId;
  const schemeName = scheme?.name ?? 'Illustrative scholarship scheme';
  const schemeId = scheme?.id ?? 'scheme-demo';
  const ruleValue = rule?.expectedValue ?? '250000';
  const ruleDisplayValue = `₹${Number(ruleValue).toLocaleString('en-IN')}`;
  const changedScheme = schemes[1] ?? scheme;
  const changedSchemeName = changedScheme?.name ?? schemeName;
  const changedSchemeId = changedScheme?.id ?? schemeId;

  return [
    createEvent({
      id: 'AUD-2026-00142',
      timestamp: '2026-10-08T10:42:00.000Z',
      userId: 'DEMO-OFFICER-01',
      userName: 'Demo Officer 01',
      role: 'Application Review Officer',
      action: 'Application Reviewed',
      actionType: 'Workflow',
      module: 'Applications',
      referenceId: applicationId,
      applicationId,
      schemeId,
      schemeName,
      previousState: 'Pending Review',
      newState: 'Reviewed',
      severity: 'Info',
    }),
    createEvent({
      id: 'AUD-2026-00141',
      timestamp: '2026-10-08T10:15:00.000Z',
      userId: 'DEMO-OFFICER-02',
      userName: 'Demo Officer 02',
      role: 'Verification Officer',
      action: 'Verification Updated',
      actionType: 'Workflow',
      module: 'Verification',
      referenceId: secondApplicationId,
      applicationId: secondApplicationId,
      schemeId: secondApplication?.schemeId,
      schemeName: secondApplication?.schemeName,
      previousState: 'Under Review',
      newState: 'Verified',
      severity: 'Medium',
    }),
    createEvent({
      id: 'AUD-2026-00140',
      timestamp: '2026-10-08T09:58:00.000Z',
      userId: 'DEMO-OFFICER-02',
      userName: 'Demo Officer 02',
      role: 'Verification Officer',
      action: 'Deficiency Raised',
      actionType: 'Workflow',
      module: 'Deficiencies',
      referenceId: 'DEF-2026-001',
      applicationId,
      schemeId,
      schemeName,
      previousState: 'No deficiency',
      newState: 'Notice issued',
      severity: 'High',
    }),
    createEvent({
      id: 'AUD-2026-00139',
      timestamp: '2026-10-08T09:20:00.000Z',
      userId: 'DEMO-OFFICER-03',
      userName: 'Demo Officer 03',
      role: 'Screening Officer',
      action: 'Screening Reviewed',
      actionType: 'Workflow',
      module: 'Screening',
      referenceId: selectedApplicationId,
      applicationId: selectedApplicationId,
      schemeId: selectedApplication?.schemeId,
      schemeName: selectedApplication?.schemeName,
      previousState: 'Pending official review',
      newState: 'Review recorded',
      severity: 'Medium',
    }),
    createEvent({
      id: 'AUD-2026-00138',
      timestamp: '2026-10-08T08:45:00.000Z',
      userId: 'DEMO-OFFICER-04',
      userName: 'Demo Officer 04',
      role: 'Selection Committee Member',
      action: 'Selection Recommended',
      actionType: 'Workflow',
      module: 'Selection',
      referenceId: selectedApplicationId,
      applicationId: selectedApplicationId,
      schemeId: selectedApplication?.schemeId,
      schemeName: selectedApplication?.schemeName,
      previousState: 'Under committee review',
      newState: 'Recommended for official consideration',
      severity: 'Medium',
    }),
    createEvent({
      id: 'AUD-2026-00137',
      timestamp: '2026-10-07T15:30:00.000Z',
      userId: 'DEMO-OFFICER-04',
      userName: 'Demo Officer 04',
      role: 'Selection Committee Chair',
      action: 'Selection Status Changed',
      actionType: 'Official Override',
      module: 'Selection',
      referenceId: selectedApplicationId,
      applicationId: selectedApplicationId,
      schemeId: selectedApplication?.schemeId,
      schemeName: selectedApplication?.schemeName,
      previousState: 'Waitlisted',
      newState: 'Selected for official approval',
      severity: 'High',
      override: {
        reason: 'Committee minutes recorded an approved correction to the illustrative status.',
        reviewStatus: 'Reviewed',
      },
    }),
    createEvent({
      id: 'AUD-2026-00136',
      timestamp: '2026-10-07T13:10:00.000Z',
      userId: 'DEMO-ADMIN-01',
      userName: 'Demo Administrator',
      role: 'Scheme Administrator',
      action: 'Scheme Updated',
      actionType: 'Configuration',
      module: 'Schemes',
      referenceId: changedSchemeId,
      schemeId: changedSchemeId,
      schemeName: changedSchemeName,
      previousState: 'Application window: 01 Jun – 30 Sep',
      newState: 'Application window: 01 Jun – 15 Oct',
      severity: 'High',
      configuration: {
        schemeId: changedSchemeId,
        schemeName: changedSchemeName,
        changedField: 'Application closing date',
        previousValue: '30 Sep 2026',
        newValue: '15 Oct 2026',
      },
    }),
    createEvent({
      id: 'AUD-2026-00135',
      timestamp: '2026-10-07T11:05:00.000Z',
      userId: 'DEMO-ADMIN-01',
      userName: 'Demo Administrator',
      role: 'Rule Configuration Officer',
      action: 'Rule Updated',
      actionType: 'Configuration',
      module: 'Rules',
      referenceId: rule?.id ?? 'RULE-DEMO-INC-01',
      schemeId,
      schemeName,
      previousState: `Income ceiling: ${ruleDisplayValue}`,
      newState: 'Income ceiling: ₹3,00,000',
      severity: 'High',
      configuration: {
        ruleId: rule?.id ?? 'RULE-DEMO-INC-01',
        schemeId,
        schemeName,
        changedField: 'Annual family income ceiling',
        previousValue: ruleDisplayValue,
        newValue: '₹3,00,000',
      },
    }),
    createEvent({
      id: 'AUD-2026-00134',
      timestamp: '2026-10-07T10:10:00.000Z',
      userId: 'DEMO-COMMS-01',
      userName: 'Demo Communications Desk',
      role: 'Communications Officer',
      action: 'Communication Created',
      actionType: 'Communication',
      module: 'Communications',
      referenceId: 'COM-2026-003',
      schemeId,
      schemeName,
      severity: 'Info',
    }),
    createEvent({
      id: 'AUD-2026-00133',
      timestamp: '2026-10-07T09:40:00.000Z',
      userId: 'DEMO-COMMS-01',
      userName: 'Demo Communications Desk',
      role: 'Communications Officer',
      action: 'Communication Sent',
      actionType: 'Communication',
      module: 'Communications',
      referenceId: 'COM-2026-001',
      applicationId,
      schemeId,
      schemeName,
      severity: 'Info',
    }),
    createEvent({
      id: 'AUD-2026-00132',
      timestamp: '2026-10-08T07:30:00.000Z',
      userId: 'DEMO-USER-01',
      userName: 'Demo User 01',
      role: 'Authorized Ministry Official',
      action: 'Login',
      actionType: 'Security',
      module: 'Authentication',
      referenceId: 'SESSION-DEMO-8F21',
      severity: 'Info',
      security: {
        ipAddress: '192.0.2.41',
        sessionId: 'SESSION-DEMO-8F21',
        deviceBrowser: 'Desktop / Chromium (demo)',
        authenticationResult: 'Success',
        securityEventType: 'Successful sign-in',
      },
    }),
    createEvent({
      id: 'AUD-2026-00131',
      timestamp: '2026-10-08T07:12:00.000Z',
      userId: 'DEMO-USER-02',
      userName: 'Demo User 02',
      role: 'Unverified Demo Account',
      action: 'Multiple Failed Login Attempts',
      actionType: 'Security',
      module: 'Authentication',
      referenceId: 'SESSION-DEMO-1C09',
      severity: 'Critical',
      security: {
        ipAddress: '198.51.100.27',
        sessionId: 'SESSION-DEMO-1C09',
        deviceBrowser: 'Mobile / Chromium (demo)',
        authenticationResult: 'Failure',
        securityEventType: 'Illustrative repeated failed authentication attempts',
      },
    }),
    createEvent({
      id: 'AUD-2026-00130',
      timestamp: '2026-10-06T16:20:00.000Z',
      userId: 'DEMO-ADMIN-02',
      userName: 'Demo Administrator 02',
      role: 'Access Control Administrator',
      action: 'Permission Change',
      actionType: 'Security',
      module: 'System',
      referenceId: 'ROLE-DEMO-REVIEWER',
      previousState: 'Screening: read-only',
      newState: 'Screening: reviewer access',
      severity: 'Critical',
      security: {
        ipAddress: '203.0.113.16',
        sessionId: 'SESSION-DEMO-22AB',
        deviceBrowser: 'Desktop / Chromium (demo)',
        authenticationResult: 'Success',
        securityEventType: 'Illustrative permission change',
      },
      override: {
        reason: 'Temporary reviewer access recorded for the prototype workflow exercise.',
        reviewStatus: 'Pending secondary review',
      },
    }),
    createEvent({
      id: 'AUD-2026-00129',
      timestamp: '2026-10-06T14:05:00.000Z',
      userId: 'DEMO-OFFICER-01',
      userName: 'Demo Officer 01',
      role: 'Application Review Officer',
      action: 'Official Override',
      actionType: 'Official Override',
      module: 'Applications',
      referenceId: applicationId,
      applicationId,
      schemeId,
      schemeName,
      previousState: 'Action Required',
      newState: 'Returned for additional review',
      severity: 'High',
      override: {
        reason: 'Demonstration override recorded after review of the submitted clarification.',
        reviewStatus: 'Pending secondary review',
      },
    }),
    createEvent({
      id: 'AUD-2026-00128',
      timestamp: '2026-10-06T12:00:00.000Z',
      userId: 'DEMO-USER-01',
      userName: 'Demo User 01',
      role: 'Authorized Ministry Official',
      action: 'Logout',
      actionType: 'Security',
      module: 'Authentication',
      referenceId: 'SESSION-DEMO-84D0',
      severity: 'Low',
      security: {
        ipAddress: '192.0.2.52',
        sessionId: 'SESSION-DEMO-84D0',
        deviceBrowser: 'Desktop / Chromium (demo)',
        authenticationResult: 'Success',
        securityEventType: 'Successful sign-out',
      },
    }),
  ];
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isAdminAuditEvent(value: unknown): value is AdminAuditEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Partial<AdminAuditEvent>;
  return (
    isString(event.id) &&
    isString(event.timestamp) &&
    isString(event.userId) &&
    isString(event.userName) &&
    isString(event.role) &&
    isString(event.action) &&
    (AUDIT_ACTION_TYPES as readonly unknown[]).includes(event.actionType) &&
    (AUDIT_MODULES as readonly unknown[]).includes(event.module) &&
    (AUDIT_SEVERITIES as readonly unknown[]).includes(event.severity) &&
    (event.referenceId === undefined || isString(event.referenceId)) &&
    (event.applicationId === undefined || isString(event.applicationId)) &&
    (event.schemeId === undefined || isString(event.schemeId)) &&
    (event.schemeName === undefined || isString(event.schemeName)) &&
    (event.relatedRecord === undefined || isString(event.relatedRecord)) &&
    (event.previousState === undefined || isString(event.previousState)) &&
    (event.newState === undefined || isString(event.newState)) &&
    (event.security === undefined || (event.security !== null &&
      typeof event.security === 'object' &&
      !Array.isArray(event.security) &&
      (event.security.ipAddress === undefined || isString(event.security.ipAddress)) &&
      (event.security.sessionId === undefined || isString(event.security.sessionId)) &&
      (event.security.deviceBrowser === undefined || isString(event.security.deviceBrowser)) &&
      (event.security.authenticationResult === undefined || ['Success', 'Failure', 'Not applicable'].includes(event.security.authenticationResult)) &&
      (event.security.securityEventType === undefined || isString(event.security.securityEventType))
    )) &&
    (event.override === undefined || (event.override !== null &&
      typeof event.override === 'object' &&
      !Array.isArray(event.override) &&
      typeof event.override.reason === 'string' &&
      ['Pending secondary review', 'Reviewed'].includes(event.override.reviewStatus)
    )) &&
    (event.configuration === undefined || (event.configuration !== null &&
      typeof event.configuration === 'object' &&
      !Array.isArray(event.configuration) &&
      isString(event.configuration.changedField) &&
      isString(event.configuration.previousValue) &&
      isString(event.configuration.newValue)
    )) &&
    Array.isArray(event.activity) &&
    event.activity.every((entry) =>
      Boolean(entry) &&
      isString(entry.id) &&
      isString(entry.timestamp) &&
      isString(entry.description)
    ) &&
    event.isDemo === true
  );
}

export function isAdminAuditEventList(value: unknown): value is AdminAuditEvent[] {
  return Array.isArray(value) && value.every(isAdminAuditEvent);
}
