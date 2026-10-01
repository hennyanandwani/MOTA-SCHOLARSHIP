export type ActionType = 'Document' | 'Application Information' | 'Other';
export type ActionStatus = 'Open' | 'Resolved';
export type ActionPriority = 'Required' | 'Important' | 'Review';

export interface ActionItem {
  id: string;
  title: string;
  schemeName: string;
  schemeId: string;
  applicationId: string;
  type: ActionType;
  priority: ActionPriority;
  issue: string;
  requiredAction: string;
  status: ActionStatus;
  raisedDate: string;
  raisedAt: string;
  deadline?: string;
  href: string;
}

export const demoOpenActions: ActionItem[] = [
  {
    id: 'income-certificate-action',
    title: 'Income Certificate needs attention',
    schemeName: 'Post-Matric Scholarship',
    schemeId: 'post-matric-st',
    applicationId: 'MOTA-2026-004821',
    type: 'Document',
    priority: 'Important',
    issue: 'Some information in the submitted income certificate requires additional review.',
    requiredAction: 'Review the document and upload a corrected copy if required.',
    status: 'Open',
    raisedDate: '20 Sep 2026',
    raisedAt: '2026-09-20',
    deadline: '30 Sep 2026',
    href: '/student/schemes/post-matric-st/apply/documents',
  },
  {
    id: 'bank-proof-action',
    title: 'Bank Account Proof is missing',
    schemeName: 'Post-Matric Scholarship',
    schemeId: 'post-matric-st',
    applicationId: 'MOTA-2026-004821',
    type: 'Document',
    priority: 'Required',
    issue: 'A required bank account proof has not been uploaded.',
    requiredAction: 'Upload the required document.',
    status: 'Open',
    raisedDate: '20 Sep 2026',
    raisedAt: '2026-09-20',
    href: '/student/schemes/post-matric-st/apply/documents',
  },
  {
    id: 'research-application-action',
    title: 'Update application information',
    schemeName: 'Research Fellowship',
    schemeId: 'national-fellowship-st',
    applicationId: 'MOTA-2026-003918',
    type: 'Application Information',
    priority: 'Review',
    issue: 'Some application information requires confirmation before the application can proceed.',
    requiredAction: 'Review the requested information and submit the correction.',
    status: 'Open',
    raisedDate: '21 Sep 2026',
    raisedAt: '2026-09-21',
    href: '/student/schemes/national-fellowship-st/apply',
  },
];

export const demoResolvedActions: ActionItem[] = [
  {
    id: 'resolved-st-certificate',
    title: 'ST Certificate uploaded',
    schemeName: 'Post-Matric Scholarship',
    schemeId: 'post-matric-st',
    applicationId: 'MOTA-2026-004821',
    type: 'Document',
    priority: 'Required',
    issue: 'Requested ST Certificate was added to the application.',
    requiredAction: 'No further action is listed for this item.',
    status: 'Resolved',
    raisedDate: '16 Sep 2026',
    raisedAt: '2026-09-16',
    href: '/student/schemes/post-matric-st/apply/documents',
  },
  {
    id: 'resolved-academic-information',
    title: 'Academic information confirmed',
    schemeName: 'Research Fellowship',
    schemeId: 'national-fellowship-st',
    applicationId: 'MOTA-2026-003918',
    type: 'Application Information',
    priority: 'Review',
    issue: 'Academic information was confirmed for the application.',
    requiredAction: 'No further action is listed for this item.',
    status: 'Resolved',
    raisedDate: '15 Sep 2026',
    raisedAt: '2026-09-15',
    href: '/student/schemes/national-fellowship-st/apply',
  },
];