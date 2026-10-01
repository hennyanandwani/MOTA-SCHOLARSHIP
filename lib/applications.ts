export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Action Required'
  | 'Selected'
  | 'Not Selected';

export type StudentApplication = {
  scheme: string;
  type: 'Scholarship' | 'Fellowship';
  id: string;
  academicYear: string;
  submitted: string;
  updated: string;
  submittedDate: string;
  updatedDate: string;
  stage: string;
  status: ApplicationStatus;
  progress: number;
  completedStages: number;
  issue?: string;
};

export const studentApplications: StudentApplication[] = [
  {
    scheme: 'Post-Matric Scholarship for ST Students',
    type: 'Scholarship',
    id: 'MOTA-2026-00124',
    academicYear: '2026–27',
    submitted: '18 Sep 2026',
    updated: '24 Sep 2026',
    submittedDate: '2026-09-18',
    updatedDate: '2026-09-24',
    stage: 'Document Verification',
    status: 'Under Review',
    progress: 65,
    completedStages: 3,
  },
  {
    scheme: 'Top Class Education Scholarship for ST Students',
    type: 'Scholarship',
    id: 'MOTA-2026-00108',
    academicYear: '2026–27',
    submitted: '12 Sep 2026',
    updated: '26 Sep 2026',
    submittedDate: '2026-09-12',
    updatedDate: '2026-09-26',
    stage: 'Document Correction',
    status: 'Action Required',
    progress: 48,
    completedStages: 2,
    issue: 'Income certificate needs to be re-uploaded.',
  },
  {
    scheme: 'National Fellowship for ST Students',
    type: 'Fellowship',
    id: 'MOTA-2026-00087',
    academicYear: '2026–27',
    submitted: '08 Sep 2026',
    updated: '20 Sep 2026',
    submittedDate: '2026-09-08',
    updatedDate: '2026-09-20',
    stage: 'Initial Scrutiny',
    status: 'Submitted',
    progress: 30,
    completedStages: 2,
  },
  {
    scheme: 'Pre-Matric Scholarship for ST Students',
    type: 'Scholarship',
    id: 'MOTA-2026-00051',
    academicYear: '2026–27',
    submitted: '02 Aug 2026',
    updated: '15 Sep 2026',
    submittedDate: '2026-08-02',
    updatedDate: '2026-09-15',
    stage: 'Selection Completed',
    status: 'Selected',
    progress: 100,
    completedStages: 5,
  },
  {
    scheme: 'Tribal Research Fellowship',
    type: 'Fellowship',
    id: 'MOTA-2026-00043',
    academicYear: '2026–27',
    submitted: '28 Jul 2026',
    updated: '22 Sep 2026',
    submittedDate: '2026-07-28',
    updatedDate: '2026-09-22',
    stage: 'Eligibility Verification',
    status: 'Under Review',
    progress: 55,
    completedStages: 3,
  },
  {
    scheme: 'ST Higher Education Support Scheme',
    type: 'Scholarship',
    id: 'MOTA-2026-00019',
    academicYear: '2025–26',
    submitted: '16 Jun 2026',
    updated: '10 Sep 2026',
    submittedDate: '2026-06-16',
    updatedDate: '2026-09-10',
    stage: 'Decision Completed',
    status: 'Not Selected',
    progress: 100,
    completedStages: 5,
  },
];