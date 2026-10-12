export type DashboardApplication = {
  id: string;
  schemeId: string;
  schemeName: string;
  applicationNumber: string;
  submittedAt: string | null;
  status: string;
  statusLabel: string;
  currentStage: string;
  applicationHref: string;
  reviewHref: string;
};

export type DashboardAction = {
  id: string;
  applicationNumber: string;
  schemeName: string;
  documentName: string;
  status: string;
  remarks: string | null;
  href: string;
};

export type DashboardScheme = {
  id: string;
  name: string;
  description: string | null;
  type: 'SCHOLARSHIP' | 'FELLOWSHIP';
};
