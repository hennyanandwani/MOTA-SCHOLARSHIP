import { studentApplications } from '@/lib/applications';

export type ApplicationStatusLabel = 'Submitted' | 'Under Review' | 'Action Required' | 'Selected' | 'Not Selected';
export type ApplicationStageState = 'completed' | 'in_progress' | 'pending';
export type DocumentReviewStatus = 'Verified' | 'Needs Attention' | 'Under Review' | 'Not Uploaded';

export interface ApplicationStage {
  id: string;
  name: string;
  status: ApplicationStageState;
  date?: string;
  description?: string;
}

export interface DocumentStatus {
  id: string;
  name: string;
  status: DocumentReviewStatus;
  required: boolean;
  fileName?: string;
}

export interface ActivityEvent {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface Communication {
  id: string;
  date: string;
  title: string;
  message: string;
  activityId: string;
}

export interface Application {
  id: string;
  schemeId: string;
  schemeName: string;
  academicYear: string;
  type: 'Scholarship' | 'Fellowship';
  submittedDate: string;
  status: ApplicationStatusLabel;
  currentStage: string;
  progress: number;
  applicant: {
    name: string;
    state: string;
    district: string;
  };
  academic: {
    institution: string;
    course: string;
    level: string;
    year: string;
  };
  stages: ApplicationStage[];
  documents: DocumentStatus[];
  activity: ActivityEvent[];
  communications: Communication[];
}

const trackedApplications: Record<string, Application> = {
  'MOTA-2026-004821': {
    id: 'MOTA-2026-004821',
    schemeId: 'post-matric-st',
    schemeName: 'Post-Matric Scholarship for ST Students',
    academicYear: '2026–27',
    type: 'Scholarship',
    submittedDate: '18 September 2026',
    status: 'Under Review',
    currentStage: 'Document Verification',
    progress: 42,
    applicant: {
      name: 'Rahul Kumar',
      state: 'Gujarat',
      district: 'Rajkot',
    },
    academic: {
      institution: 'Government College',
      course: 'B.Sc. Computer Science',
      level: 'Undergraduate',
      year: '2026–27',
    },
    stages: [
      {
        id: 'application-submitted',
        name: 'Application Submitted',
        status: 'completed',
        date: '18 September 2026',
        description: 'Your application was successfully submitted.',
      },
      {
        id: 'document-verification',
        name: 'Document Verification',
        status: 'in_progress',
        description: 'Submitted documents are being reviewed.',
      },
      { id: 'eligibility-verification', name: 'Eligibility Verification', status: 'pending' },
      { id: 'official-scrutiny', name: 'Official Scrutiny', status: 'pending' },
      { id: 'screening-selection', name: 'Screening / Selection', status: 'pending' },
      { id: 'outcome-communication', name: 'Outcome Communication', status: 'pending' },
    ],
    documents: [
      { id: 'st-certificate', name: 'ST Certificate', status: 'Verified', required: true, fileName: 'st_certificate_rahul_kumar.pdf' },
      { id: 'income-certificate', name: 'Income Certificate', status: 'Needs Attention', required: true, fileName: 'income_certificate.pdf' },
      { id: 'identity-proof', name: 'Aadhaar / Identity Proof', status: 'Under Review', required: true, fileName: 'identity_document.pdf' },
      { id: 'academic-marksheet', name: 'Previous Academic Marksheet', status: 'Verified', required: true, fileName: 'class_12_marksheet.pdf' },
      { id: 'admission-proof', name: 'Admission / Bonafide', status: 'Under Review', required: true, fileName: 'bonafide_certificate.pdf' },
      { id: 'bank-proof', name: 'Bank Account Proof', status: 'Not Uploaded', required: true },
      { id: 'photograph', name: 'Passport Photograph', status: 'Verified', required: true, fileName: 'passport_photo.jpg' },
    ],
    activity: [
      {
        id: 'activity-application-submitted',
        date: '18 Sep 2026',
        title: 'Application submitted',
        description: 'Your application was successfully submitted.',
      },
      {
        id: 'activity-application-received',
        date: '19 Sep 2026',
        title: 'Application received',
        description: 'Your application entered the official workflow.',
      },
      {
        id: 'activity-verification-started',
        date: '20 Sep 2026',
        title: 'Document verification started',
        description: 'Document review has started.',
      },
    ],
    communications: [
      {
        id: 'communication-application-received',
        date: '18 Sep 2026',
        title: 'Application received',
        message: 'Your application has been successfully received.',
        activityId: 'activity-application-received',
      },
      {
        id: 'communication-verification-started',
        date: '20 Sep 2026',
        title: 'Document verification started',
        message: 'Your submitted documents have entered the verification workflow.',
        activityId: 'activity-verification-started',
      },
    ],
  },
};

export function getTrackedApplication(applicationId: string): Application | undefined {
  const tracked = trackedApplications[applicationId];
  if (tracked) return tracked;

  const listedApplication = studentApplications.find((application) => application.id === applicationId);
  if (!listedApplication) return undefined;

  const template = trackedApplications['MOTA-2026-004821'];
  const schemeIdByApplicationId: Record<string, string> = {
    'MOTA-2026-00124': 'post-matric-st',
    'MOTA-2026-00108': 'top-class-st',
    'MOTA-2026-00087': 'national-fellowship-st',
    'MOTA-2026-00051': 'pre-matric-st',
    'MOTA-2026-00043': 'tribal-research-fellowship',
    'MOTA-2026-00019': 'higher-studies-assistance',
  };
  const stageIndex = getCurrentStageIndex(listedApplication.stage);

  return {
    ...template,
    id: listedApplication.id,
    schemeId: schemeIdByApplicationId[listedApplication.id] ?? template.schemeId,
    schemeName: listedApplication.scheme,
    academicYear: listedApplication.academicYear,
    type: listedApplication.type,
    submittedDate: listedApplication.submitted,
    status: listedApplication.status === 'Draft' ? 'Submitted' : listedApplication.status,
    currentStage: listedApplication.stage,
    progress: listedApplication.progress,
    stages: template.stages.map((stage, index) => ({
      ...stage,
      status: index < stageIndex ? 'completed' : index === stageIndex ? 'in_progress' : 'pending',
      date: index === 0 ? listedApplication.submitted : undefined,
    })),
  };
}

function getCurrentStageIndex(stage: string): number {
  const normalizedStage = stage.toLowerCase();
  if (normalizedStage.includes('document')) return 1;
  if (normalizedStage.includes('eligibility')) return 2;
  if (normalizedStage.includes('scrutiny')) return 3;
  if (normalizedStage.includes('screening') || normalizedStage.includes('selection')) return 4;
  if (normalizedStage.includes('decision') || normalizedStage.includes('completed')) return 5;
  return 1;
}