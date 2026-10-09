export const ADMIN_SUPPORT_STORAGE_KEY = 'mota_admin_support_state';

export const ADMIN_SUPPORT_CATEGORIES = [
  'Application Workflow',
  'Documents & Verification',
  'Deficiencies',
  'Screening & Selection',
  'Schemes & Rules',
  'Communications',
  'Reports & Audit',
  'Account & Access',
  'Technical Issue',
] as const;
export type AdminSupportCategory = (typeof ADMIN_SUPPORT_CATEGORIES)[number];

export const ADMIN_SUPPORT_MODULES = [
  'Overview',
  'Applications',
  'Verification',
  'Deficiencies',
  'Screening',
  'Selection & Sanction',
  'Schemes',
  'Rule Configuration',
  'Communications',
  'Analytics & Reports',
  'Audit Logs',
  'Profile & Settings',
  'System',
] as const;
export type AdminSupportModule = (typeof ADMIN_SUPPORT_MODULES)[number];

export type AdminSupportPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type AdminSupportStatus = 'Submitted' | 'In Review' | 'Resolved' | 'Closed';

export type AdminSupportRequest = {
  id: string;
  category: AdminSupportCategory;
  module: AdminSupportModule;
  subject: string;
  description: string;
  priority: AdminSupportPriority;
  referenceId?: string;
  status: AdminSupportStatus;
  createdAt: string;
  updatedAt: string;
};

export function isAdminSupportRequest(value: unknown): value is AdminSupportRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const request = value as Partial<AdminSupportRequest>;
  return (
    typeof request.id === 'string' &&
    (ADMIN_SUPPORT_CATEGORIES as readonly unknown[]).includes(request.category) &&
    (ADMIN_SUPPORT_MODULES as readonly unknown[]).includes(request.module) &&
    typeof request.subject === 'string' &&
    typeof request.description === 'string' &&
    ['Low', 'Normal', 'High', 'Urgent'].includes(String(request.priority)) &&
    (request.referenceId === undefined || typeof request.referenceId === 'string') &&
    ['Submitted', 'In Review', 'Resolved', 'Closed'].includes(String(request.status)) &&
    typeof request.createdAt === 'string' &&
    typeof request.updatedAt === 'string'
  );
}

export function isAdminSupportRequestList(value: unknown): value is AdminSupportRequest[] {
  return Array.isArray(value) && value.every(isAdminSupportRequest);
}
