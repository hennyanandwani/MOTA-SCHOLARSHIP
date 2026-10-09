export type DeficiencySeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type DeficiencyType = 'Missing Document' | 'Invalid Document' | 'Data Mismatch' | 'Incomplete Information' | 'Expired Certificate' | 'Other';
export type DeficiencyStatus = 'Open' | 'Notice Sent' | 'Awaiting Response' | 'Resubmitted' | 'Under Review' | 'Resolved' | 'Escalated' | 'Rejected';
export type NoticeStatus = 'Draft' | 'Sent' | 'Delivered' | 'Acknowledged';
export type ResponseStatus = 'No Response' | 'Response Submitted' | 'Documents Resubmitted' | 'Information Updated';
export type DeliveryChannel = 'Portal' | 'Email' | 'SMS';
export type DetectionSource = 'AI-assisted flag' | 'Officer identified';
export type ActivityType = 'system' | 'ai' | 'reviewer' | 'notice' | 'response';

export interface ActivityEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  note?: string;
  type: ActivityType;
}

export interface DeficiencyRecord {
  id: string;
  applicationId: string;
  applicantName: string;
  scheme: string;
  state: string;
  district: string;
  deficiency: string;
  deficiencyType: DeficiencyType;
  severity: DeficiencySeverity;
  affectedField?: string;
  affectedDocument?: string | null;
  description: string;
  detectionSource: DetectionSource;
  raisedDate: string;
  cureDeadline: string;
  status: DeficiencyStatus;
  noticeStatus: NoticeStatus;
  noticeDate?: string;
  deliveryChannels?: DeliveryChannel[];
  responseStatus: ResponseStatus;
  responseDate?: string;
  studentNote?: string;
  responseItems?: string[];
  reviewer?: string | null;
  reviewerDecision?: 'Resolve Deficiency' | 'Request Correction' | 'Escalate' | 'Reject Submission';
  reviewerNote?: string;
  rejectionReason?: string;
  correctionNote?: string;
  escalationReason?: string;
  newDeadline?: string;
  decisionDate?: string;
  activities: ActivityEntry[];
}

export const INITIAL_DEFICIENCY_RECORDS: DeficiencyRecord[] = [
  { id: 'DEF-2026-001', applicationId: 'MOTA-2026-7842', applicantName: 'Rahul Bhil', scheme: 'Post Matric Scholarship for ST Students', state: 'Madhya Pradesh', district: 'Jhabua', deficiency: 'Certificate number mismatch', deficiencyType: 'Data Mismatch', severity: 'High', affectedField: 'Certificate Number', affectedDocument: 'ST Certificate', description: 'Certificate number mismatch detected.', detectionSource: 'AI-assisted flag', raisedDate: '2026-09-24 10:20 AM', cureDeadline: '2026-10-15 23:59', status: 'Awaiting Response', noticeStatus: 'Sent', noticeDate: '2026-09-24 11:30 AM', deliveryChannels: ['Portal', 'Email'], responseStatus: 'No Response', reviewer: 'MoTA Administrator', activities: [{ id: 'A1', timestamp: '2026-09-24 10:20 AM', action: 'Deficiency detected', actor: 'AI Engine', type: 'ai' }] },
  { id: 'DEF-2026-002', applicationId: 'MOTA-2026-4521', applicantName: 'Lila Devi', scheme: 'National Fellowship for ST Students', state: 'Jharkhand', district: 'Giridih', deficiency: 'Missing bank details', deficiencyType: 'Incomplete Information', severity: 'Critical', affectedField: 'Bank Account', affectedDocument: null, description: 'Application lacks bank details.', detectionSource: 'Officer identified', raisedDate: '2026-09-23 02:15 PM', cureDeadline: '2026-09-30 23:59', status: 'Under Review', noticeStatus: 'Delivered', noticeDate: '2026-09-23 03:00 PM', deliveryChannels: ['Portal'], responseStatus: 'Response Submitted', responseDate: '2026-09-27 10:30 AM', studentNote: 'Updated.', reviewer: 'MoTA Administrator', activities: [{ id: 'A1', timestamp: '2026-09-23 02:15 PM', action: 'Detected', actor: 'Officer', type: 'reviewer' }] },
  { id: 'DEF-2026-003', applicationId: 'MOTA-2026-9012', applicantName: 'Amit Kerketta', scheme: 'Pre-Matric Scholarship', state: 'Odisha', district: 'Sundargarh', deficiency: 'Expired certificate', deficiencyType: 'Expired Certificate', severity: 'Medium', affectedField: 'Income Certificate', affectedDocument: 'Income Cert', description: 'Certificate expired.', detectionSource: 'AI-assisted flag', raisedDate: '2026-09-20 09:00 AM', cureDeadline: '2026-10-05 23:59', status: 'Resolved', noticeStatus: 'Acknowledged', noticeDate: '2026-09-20 10:00 AM', deliveryChannels: ['Portal'], responseStatus: 'Documents Resubmitted', responseDate: '2026-09-25 11:15 AM', reviewer: 'MoTA Administrator', reviewerDecision: 'Resolve Deficiency', decisionDate: '2026-09-26 04:30 PM', activities: [{ id: 'A1', timestamp: '2026-09-20 09:00 AM', action: 'Detected', actor: 'AI', type: 'ai' }] },
  { id: 'DEF-2026-004', applicationId: 'MOTA-2026-3344', applicantName: 'Sunita Marandi', scheme: 'Top Class Education', state: 'West Bengal', district: 'Purulia', deficiency: 'Invalid document', deficiencyType: 'Invalid Document', severity: 'High', affectedField: 'Admission', affectedDocument: 'Admission', description: 'Document unclear.', detectionSource: 'Officer identified', raisedDate: '2026-09-26 11:30 AM', cureDeadline: '2026-10-10 23:59', status: 'Notice Sent', noticeStatus: 'Sent', noticeDate: '2026-09-26 12:00 PM', deliveryChannels: ['Portal'], responseStatus: 'No Response', reviewer: 'MoTA Administrator', activities: [{ id: 'A1', timestamp: '2026-09-26 11:30 AM', action: 'Detected', actor: 'Officer', type: 'reviewer' }] },
  { id: 'DEF-2026-005', applicationId: 'MOTA-2026-1122', applicantName: 'Birsa Munda Jr.', scheme: 'Post Matric', state: 'Chhattisgarh', district: 'Bastar', deficiency: 'Name mismatch', deficiencyType: 'Data Mismatch', severity: 'Medium', affectedField: 'Name', affectedDocument: 'Aadhaar', description: 'Name mismatch.', detectionSource: 'AI-assisted flag', raisedDate: '2026-09-27 10:00 AM', cureDeadline: '2026-10-12 23:59', status: 'Open', noticeStatus: 'Draft', deliveryChannels: ['Portal'], responseStatus: 'No Response', reviewer: 'MoTA Administrator', activities: [{ id: 'A1', timestamp: '2026-09-27 10:00 AM', action: 'Detected', actor: 'AI', type: 'ai' }] },
  { id: 'DEF-2026-006', applicationId: 'MOTA-2026-5566', applicantName: 'Priya Meena', scheme: 'National Fellowship', state: 'Rajasthan', district: 'Udaipur', deficiency: 'Wrong category', deficiencyType: 'Invalid Document', severity: 'High', affectedField: 'Caste', affectedDocument: 'Caste Cert', description: 'Wrong certificate.', detectionSource: 'Officer identified', raisedDate: '2026-09-21 03:00 PM', cureDeadline: '2026-09-25 23:59', status: 'Escalated', noticeStatus: 'Acknowledged', noticeDate: '2026-09-21 04:00 PM', deliveryChannels: ['Portal'], responseStatus: 'Documents Resubmitted', responseDate: '2026-09-24 02:00 PM', reviewer: 'MoTA Administrator', escalationReason: 'Repeated errors', activities: [{ id: 'A1', timestamp: '2026-09-21 03:00 PM', action: 'Detected', actor: 'Officer', type: 'reviewer' }] },
  { id: 'DEF-2026-007', applicationId: 'MOTA-2026-7788', applicantName: 'Kalyan Gond', scheme: 'Pre-Matric', state: 'Madhya Pradesh', district: 'Mandla', deficiency: 'Unclear signature', deficiencyType: 'Incomplete Information', severity: 'Low', affectedField: 'Signature', affectedDocument: 'Signature', description: 'Signature cropped.', detectionSource: 'AI-assisted flag', raisedDate: '2026-09-28 09:30 AM', cureDeadline: '2026-10-18 23:59', status: 'Awaiting Response', noticeStatus: 'Sent', noticeDate: '2026-09-28 10:00 AM', deliveryChannels: ['Portal'], responseStatus: 'No Response', reviewer: 'MoTA Administrator', activities: [{ id: 'A1', timestamp: '2026-09-28 09:30 AM', action: 'Detected', actor: 'AI', type: 'ai' }] },
  { id: 'DEF-2026-008', applicationId: 'MOTA-2026-9900', applicantName: 'Meera Uraon', scheme: 'Post Matric', state: 'Bihar', district: 'Jamui', deficiency: 'Fee mismatch', deficiencyType: 'Data Mismatch', severity: 'Medium', affectedField: 'Fee', affectedDocument: 'Fee Receipt', description: 'Fee mismatch.', detectionSource: 'AI-assisted flag', raisedDate: '2026-09-22 11:00 AM', cureDeadline: '2026-09-29 23:59', status: 'Resubmitted', noticeStatus: 'Delivered', noticeDate: '2026-09-22 12:00 PM', deliveryChannels: ['Portal'], responseStatus: 'Information Updated', responseDate: '2026-09-28 04:45 PM', reviewer: 'MoTA Administrator', activities: [{ id: 'A1', timestamp: '2026-09-22 11:00 AM', action: 'Detected', actor: 'AI', type: 'ai' }] },
];

export const LOCALSTORAGE_DEFICIENCY_KEY = 'mota_admin_deficiencies_state';

function isDeficiencyRecord(value: unknown): value is DeficiencyRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Partial<DeficiencyRecord>;
  return typeof record.id === 'string' &&
    typeof record.applicationId === 'string' &&
    typeof record.applicantName === 'string' &&
    typeof record.scheme === 'string' &&
    typeof record.state === 'string' &&
    typeof record.deficiency === 'string' &&
    typeof record.deficiencyType === 'string' &&
    typeof record.severity === 'string' &&
    typeof record.description === 'string' &&
    typeof record.raisedDate === 'string' &&
    typeof record.cureDeadline === 'string' &&
    typeof record.status === 'string' &&
    Array.isArray(record.activities);
}

export function getInitialDeficiencyRecords(): DeficiencyRecord[] {
  if (typeof window === 'undefined') return INITIAL_DEFICIENCY_RECORDS;
  try {
    const saved = localStorage.getItem(LOCALSTORAGE_DEFICIENCY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isDeficiencyRecord)) return parsed;
    }
  } catch (e) {
    console.warn('Unable to load deficiency state', e);
  }
  return INITIAL_DEFICIENCY_RECORDS;
}

export function reloadDeficiencyRecords(): { records: DeficiencyRecord[]; error?: string } {
  if (typeof window === 'undefined') return { records: INITIAL_DEFICIENCY_RECORDS };
  try {
    const saved = window.localStorage.getItem(LOCALSTORAGE_DEFICIENCY_KEY);
    if (!saved) return { records: INITIAL_DEFICIENCY_RECORDS };
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isDeficiencyRecord)) {
      return { records: parsed };
    }
    if (Array.isArray(parsed)) return { records: INITIAL_DEFICIENCY_RECORDS };
    return {
      records: INITIAL_DEFICIENCY_RECORDS,
      error: 'Saved deficiency data is invalid; illustrative defaults are shown.',
    };
  } catch {
    return {
      records: INITIAL_DEFICIENCY_RECORDS,
      error: 'Saved deficiency data could not be read; illustrative defaults are shown.',
    };
  }
}

export function saveDeficiencyRecordsToLocalStorage(records: DeficiencyRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALSTORAGE_DEFICIENCY_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Unable to persist deficiency state', e);
  }
}
