import type { AdminApplicationRecord } from '@/lib/adminData';
import type { DeficiencyRecord } from '@/lib/adminDeficiencyData';
import type { Scheme } from '@/lib/schemes';

export const COMMUNICATION_TYPES = [
  'General Broadcast',
  'Application Update',
  'Deficiency Notice',
  'Screening Update',
  'Selection Update',
  'Scheme Announcement',
  'Document Reminder',
  'Official Alert',
] as const;
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

export const COMMUNICATION_AUDIENCES = [
  'All Applicants',
  'Selected Applicants',
  'Pending Applicants',
  'Specific Scheme',
  'Specific Application',
  'State / Region',
] as const;
export type CommunicationAudience = (typeof COMMUNICATION_AUDIENCES)[number];

export const COMMUNICATION_CHANNELS = [
  'Portal',
  'Email',
  'SMS',
  'Portal + Email',
  'Portal + SMS',
  'All Available Channels',
] as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const COMMUNICATION_STATUSES = [
  'Draft',
  'Scheduled',
  'Sending',
  'Sent',
  'Failed',
  'Cancelled',
] as const;
export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];

export type CommunicationActivity = {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  actor: string;
  isDemo: boolean;
};

export type CommunicationDeliveryStats = {
  totalRecipients: number;
  delivered: number;
  pending: number;
  failed: number;
};

export type AdminCommunication = {
  id: string;
  subject: string;
  type: CommunicationType;
  message: string;
  audience: CommunicationAudience;
  recipientCount: number;
  channel: CommunicationChannel;
  schemeId?: string;
  schemeName?: string;
  applicationId?: string;
  applicantName?: string;
  state?: string;
  category?: string;
  status: CommunicationStatus;
  scheduledAt?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  deliveryStats: CommunicationDeliveryStats;
  activity: CommunicationActivity[];
};

export const ADMIN_COMMUNICATIONS_STORAGE_KEY = 'mota_admin_communications_state';

export type CommunicationSeedContext = {
  applications: AdminApplicationRecord[];
  schemes: Pick<Scheme, 'id' | 'name'>[];
  deficiencies: DeficiencyRecord[];
};

function activity(
  id: string,
  action: string,
  details: string,
  timestamp: string,
): CommunicationActivity {
  return { id, action, details, timestamp, actor: 'MoTA Communications Desk', isDemo: true };
}

function seedRecord(
  partial: Omit<AdminCommunication, 'recipientCount' | 'deliveryStats' | 'activity' | 'createdBy' | 'updatedAt'>,
  recipientCount: number,
  deliveryStats: CommunicationDeliveryStats,
): AdminCommunication {
  const timestamp = partial.createdAt;
  return {
    ...partial,
    recipientCount,
    createdBy: 'MoTA Administrator',
    updatedAt: timestamp,
    deliveryStats,
    activity: [
      activity(`${partial.id}-created`, 'Communication created', 'Illustrative communication record created for demonstration.', timestamp),
      ...(partial.status === 'Scheduled'
        ? [activity(`${partial.id}-scheduled`, 'Scheduled', 'Scheduled in demo mode. No external delivery service is connected.', partial.scheduledAt ?? timestamp)]
        : []),
      ...(partial.status === 'Sent'
        ? [
            activity(`${partial.id}-send`, 'Send initiated', 'Demo send initiated; no external service was contacted.', timestamp),
            activity(`${partial.id}-delivery`, 'Delivery result recorded', 'Illustrative delivery statistics recorded for this prototype.', timestamp),
          ]
        : []),
      ...(partial.status === 'Failed'
        ? [activity(`${partial.id}-failed`, 'Delivery result recorded', 'Illustrative demo delivery attempt needs attention.', timestamp)]
        : []),
    ],
  };
}

export function createInitialCommunications(context: CommunicationSeedContext): AdminCommunication[] {
  const scheme = context.schemes[1] ?? context.schemes[0];
  const application = context.applications[0];
  const deficiency = context.deficiencies[0];
  const deficiencyApplication = context.applications.find((item) => item.applicationId === deficiency?.applicationId);
  const schemeId = scheme?.id ?? application?.schemeId;
  const schemeName = scheme?.name ?? application?.schemeName;
  const appId = application?.applicationId ?? deficiency?.applicationId;
  const applicantName = application?.applicantName ?? deficiency?.applicantName;
  const state = application?.state ?? deficiency?.state;

  return [
    seedRecord({
      id: 'COM-2026-001',
      subject: 'Application received — next steps',
      type: 'Application Update',
      message: 'Your application has been received. Please check the portal for updates and ensure your profile and documents remain current.',
      audience: 'Specific Application',
      channel: 'Portal + Email',
      schemeId: application?.schemeId,
      schemeName: application?.schemeName,
      applicationId: appId,
      applicantName,
      state,
      category: application?.category,
      status: 'Sent',
      createdAt: '2026-09-24T09:15:00.000Z',
    }, 1, { totalRecipients: 1, delivered: 1, pending: 0, failed: 0 }),
    seedRecord({
      id: 'COM-2026-002',
      subject: 'Correction required: supporting certificate',
      type: 'Deficiency Notice',
      message: `Please review the deficiency notice for application ${deficiency?.applicationId ?? 'MOTA-DEMO-001'}. Submit a clear and valid supporting certificate through the portal by the date indicated in your application.`,
      audience: 'Specific Application',
      channel: 'Portal + Email',
      schemeId: deficiencyApplication?.schemeId,
      schemeName: deficiencyApplication?.schemeName ?? deficiency?.scheme ?? schemeName,
      applicationId: deficiency?.applicationId,
      applicantName: deficiency?.applicantName,
      state: deficiency?.state,
      category: application?.category ?? 'ST',
      status: 'Sent',
      createdAt: '2026-09-24T11:30:00.000Z',
    }, 1, { totalRecipients: 1, delivered: 1, pending: 0, failed: 0 }),
    seedRecord({
      id: 'COM-2026-003',
      subject: 'Post-Matric scheme window reminder',
      type: 'Scheme Announcement',
      message: 'The application window for this scheme is open. Review the current scheme notice and complete your application before the published closing date.',
      audience: 'Specific Scheme',
      channel: 'Portal',
      schemeId,
      schemeName,
      status: 'Scheduled',
      scheduledAt: '2026-10-20T09:30:00.000Z',
      createdAt: '2026-10-08T08:15:00.000Z',
    }, 6120, { totalRecipients: 6120, delivered: 0, pending: 6120, failed: 0 }),
    seedRecord({
      id: 'COM-2026-004',
      subject: 'Screening update',
      type: 'Screening Update',
      message: 'Your application is under official screening. The screening status shown in the portal is preliminary and does not constitute a final eligibility decision.',
      audience: 'Pending Applicants',
      channel: 'Portal + SMS',
      schemeId,
      schemeName,
      status: 'Draft',
      createdAt: '2026-10-08T09:05:00.000Z',
    }, 0, { totalRecipients: 0, delivered: 0, pending: 0, failed: 0 }),
    seedRecord({
      id: 'COM-2026-005',
      subject: 'Official application service notice',
      type: 'Official Alert',
      message: 'This is an illustrative service notice. Please use the official portal for current information and retain your application reference for future correspondence.',
      audience: 'All Applicants',
      channel: 'All Available Channels',
      status: 'Failed',
      createdAt: '2026-10-07T07:30:00.000Z',
    }, 12450, { totalRecipients: 12450, delivered: 11810, pending: 120, failed: 520 }),
    seedRecord({
      id: 'COM-2026-006',
      subject: 'Selection review status',
      type: 'Selection Update',
      message: 'A selection update is available in your portal. Any displayed recommendation remains subject to official review and sanction procedures.',
      audience: 'Selected Applicants',
      channel: 'Portal + Email',
      schemeId: context.schemes[0]?.id,
      schemeName: context.schemes[0]?.name,
      status: 'Cancelled',
      createdAt: '2026-10-05T12:00:00.000Z',
    }, 0, { totalRecipients: 0, delivered: 0, pending: 0, failed: 0 }),
  ];
}

export function isCommunicationActivity(value: unknown): value is CommunicationActivity {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entry = value as Partial<CommunicationActivity>;
  return typeof entry.id === 'string' &&
    typeof entry.action === 'string' &&
    typeof entry.details === 'string' &&
    typeof entry.timestamp === 'string' &&
    typeof entry.actor === 'string' &&
    typeof entry.isDemo === 'boolean';
}

export function isAdminCommunication(value: unknown): value is AdminCommunication {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Partial<AdminCommunication>;
  const stats = record.deliveryStats as Partial<CommunicationDeliveryStats> | undefined;
  return typeof record.id === 'string' &&
    typeof record.subject === 'string' &&
    COMMUNICATION_TYPES.includes(record.type as CommunicationType) &&
    typeof record.message === 'string' &&
    COMMUNICATION_AUDIENCES.includes(record.audience as CommunicationAudience) &&
    typeof record.recipientCount === 'number' &&
    COMMUNICATION_CHANNELS.includes(record.channel as CommunicationChannel) &&
    COMMUNICATION_STATUSES.includes(record.status as CommunicationStatus) &&
    typeof record.createdAt === 'string' &&
    typeof record.createdBy === 'string' &&
    typeof record.updatedAt === 'string' &&
    Boolean(stats) &&
    typeof stats?.totalRecipients === 'number' &&
    typeof stats.delivered === 'number' &&
    typeof stats.pending === 'number' &&
    typeof stats.failed === 'number' &&
    Array.isArray(record.activity) &&
    record.activity.every(isCommunicationActivity);
}

export function isAdminCommunicationList(value: unknown): value is AdminCommunication[] {
  return Array.isArray(value) && value.every(isAdminCommunication);
}

export function deliveredPercentage(stats: CommunicationDeliveryStats): number {
  if (stats.totalRecipients === 0) return 0;
  return Math.round((stats.delivered / stats.totalRecipients) * 100);
}
