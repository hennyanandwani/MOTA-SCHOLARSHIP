export type NotificationCategory = 'application' | 'document' | 'action' | 'scheme' | 'system';
export type NotificationStatus = 'unread' | 'read';
export type NotificationPriority = 'important' | 'normal';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  date: string;
  dateTime: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  actionLabel?: string;
  actionHref?: string;
  applicationId?: string;
  schemeName?: string;
}

export const demoNotifications: NotificationItem[] = [
  {
    id: 'application-received',
    category: 'application',
    title: 'Application received successfully',
    message: 'Your application for the Post-Matric Scholarship has been successfully submitted and entered the official workflow.',
    date: '20 Sep 2026',
    dateTime: '2026-09-20T10:00:00',
    status: 'unread',
    priority: 'important',
    actionLabel: 'View Application',
    actionHref: '/student/applications',
    applicationId: 'MOTA-2026-00124',
    schemeName: 'Post-Matric Scholarship',
  },
  {
    id: 'income-certificate-attention',
    category: 'document',
    title: 'Income Certificate needs attention',
    message: 'Your submitted income certificate requires additional review. Please check the document status and follow the instructions provided.',
    date: '20 Sep 2026',
    dateTime: '2026-09-20T09:00:00',
    status: 'unread',
    priority: 'important',
    actionLabel: 'Review Document',
    actionHref: '/student/schemes/post-matric-st/apply/documents',
    applicationId: 'MOTA-2026-004821',
    schemeName: 'Post-Matric Scholarship',
  },
  {
    id: 'bank-proof-missing',
    category: 'action',
    title: 'Bank Account Proof is missing',
    message: 'A required bank account proof has not been uploaded for your scholarship application.',
    date: '19 Sep 2026',
    dateTime: '2026-09-19T15:30:00',
    status: 'unread',
    priority: 'normal',
    actionLabel: 'Take Action',
    actionHref: '/student/action-required',
    applicationId: 'MOTA-2026-004821',
    schemeName: 'Post-Matric Scholarship',
  },
  {
    id: 'document-verification-started',
    category: 'application',
    title: 'Document verification started',
    message: 'Official document verification has started for your scholarship application.',
    date: '19 Sep 2026',
    dateTime: '2026-09-19T11:15:00',
    status: 'read',
    priority: 'normal',
    actionLabel: 'View Status',
    actionHref: '/student/applications/MOTA-2026-00124',
    applicationId: 'MOTA-2026-00124',
    schemeName: 'Post-Matric Scholarship',
  },
  {
    id: 'new-scheme-opportunity',
    category: 'scheme',
    title: 'New scholarship opportunity available',
    message: 'A scholarship scheme matching some of your profile information is now available for review.',
    date: '18 Sep 2026',
    dateTime: '2026-09-18T14:00:00',
    status: 'read',
    priority: 'normal',
    actionLabel: 'View Schemes',
    actionHref: '/student/all-schemes',
  },
  {
    id: 'application-stage-updated',
    category: 'application',
    title: 'Application status updated',
    message: 'Your application has moved to the next stage of the official workflow.',
    date: '17 Sep 2026',
    dateTime: '2026-09-17T12:10:00',
    status: 'read',
    priority: 'normal',
    actionLabel: 'Track Application',
    actionHref: '/student/applications',
    applicationId: 'MOTA-2026-00124',
    schemeName: 'Post-Matric Scholarship',
  },
  {
    id: 'profile-saved',
    category: 'system',
    title: 'Profile information saved',
    message: 'Your profile information was successfully updated.',
    date: '16 Sep 2026',
    dateTime: '2026-09-16T09:20:00',
    status: 'read',
    priority: 'normal',
  },
  {
    id: 'application-window-reminder',
    category: 'scheme',
    title: 'Application window reminder',
    message: 'Review the applicable scheme dates before submitting a new application.',
    date: '15 Sep 2026',
    dateTime: '2026-09-15T08:00:00',
    status: 'read',
    priority: 'normal',
    actionLabel: 'View Schemes',
    actionHref: '/student/all-schemes',
  },
];

export const notificationCategoryLabels: Record<NotificationCategory, string> = {
  application: 'Applications',
  document: 'Documents',
  action: 'Action Required',
  scheme: 'Schemes',
  system: 'System',
};