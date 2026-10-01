export type WorkflowStage =
  | 'Submitted'
  | 'Verification'
  | 'Scrutiny'
  | 'Screening'
  | 'Selection'
  | 'Disbursement';

export type ApplicationStatus =
  | 'Under Review'
  | 'Action Required'
  | 'Verified'
  | 'Screened'
  | 'Selected'
  | 'Rejected'
  | 'Sanctioned';

export type VerificationStatus =
  | 'Pending'
  | 'In Progress'
  | 'Verified'
  | 'Discrepancy Flagged'
  | 'Failed';

export type DeficiencyStatus =
  | 'None'
  | 'Notice Issued'
  | 'Student Resubmitted'
  | 'Resolved'
  | 'Escalated';

export type HeatmapIntensity = 'Low' | 'Medium' | 'High' | 'Very High';

export type AdminDashboardMetrics = {
  totalApplications: number;
  underReview: number;
  verificationPending: number;
  deficiencies: number;
  selected: number;
  pendingActions: number;
  sanctionedAmount: string;
  avgProcessingDays: number;
  slaComplianceRate: number;
};

export type AdminApplicationRecord = {
  applicationId: string;
  applicantName: string;
  category: 'ST';
  gender: 'Male' | 'Female' | 'Other';
  schemeId: string;
  schemeName: string;
  academicYear: string;
  state: string;
  district: string;
  institutionName: string;
  course: string;
  academicLevel?: string;
  familyIncome: number;
  submittedDate: string;
  currentStage: WorkflowStage;
  status: ApplicationStatus;
  verificationStatus: VerificationStatus;
  deficiencyStatus: DeficiencyStatus;
  riskScore: 'Low' | 'Medium' | 'High';
  lastActionDate: string;
  assignedOfficer?: string;
  notes?: string;
  verifiedDocsCount?: number;
  pendingDocsCount?: number;
  flaggedDocsCount?: number;
  deficiencyIssueCount?: number;
  lastNoticeDate?: string;
  deficiencyResponseStatus?: string;
};

export type WorkflowStageSummary = {
  id: string;
  stage: WorkflowStage;
  label: string;
  count: number;
  percentage: number;
  avgDaysInStage: number;
  targetSlaDays: number;
  description: string;
};

export type AdminActivityLog = {
  id: string;
  timestamp: string;
  activity: string;
  applicationId: string;
  applicantName?: string;
  actor: string;
  role: string;
  status: 'Success' | 'Warning' | 'Info' | 'Action';
  details: string;
};

export type AdminSchemeSummary = {
  schemeId: string;
  schemeName: string;
  category: 'Scholarship' | 'Fellowship';
  totalSlots: number;
  applications: number;
  underReview: number;
  deficiencies: number;
  selected: number;
  sanctionedCount: number;
  budgetAllocated: string;
  budgetUtilized: string;
  deadline: string;
  status: 'Open' | 'Upcoming' | 'Closed';
};

export type DistrictMetric = {
  district: string;
  applicationCount: number;
  verificationPending: number;
  deficiencyCount: number;
  selectedCount: number;
  intensity: HeatmapIntensity;
};

export type StateGeographicData = {
  state: string;
  stateCode: string;
  applicationCount: number;
  verificationPending: number;
  deficiencyCount: number;
  selectedCount: number;
  intensity: HeatmapIntensity;
  districts: DistrictMetric[];
};

export const ADMIN_DEMO_NOTICE = {
  title: 'Administrative Simulation & Demonstration Environment',
  description:
    'This portal interface displays illustrative demonstration data for technical evaluation (SIH 2026 PS 26239). Figures, application identifiers, and applicant records do not represent real personal data or official Ministry statistics.',
} as const;

export const adminDashboardMetrics: AdminDashboardMetrics = {
  totalApplications: 12450,
  underReview: 4230,
  verificationPending: 2840,
  deficiencies: 624,
  selected: 1420,
  pendingActions: 348,
  sanctionedAmount: '₹48.60 Cr',
  avgProcessingDays: 16,
  slaComplianceRate: 94.8,
};

export const adminWorkflowStages: WorkflowStageSummary[] = [
  {
    id: 'stage-submitted',
    stage: 'Submitted',
    label: 'Application Intake',
    count: 12450,
    percentage: 100,
    avgDaysInStage: 1,
    targetSlaDays: 2,
    description: 'Fresh applications received and queued for preliminary integrity checks.',
  },
  {
    id: 'stage-verification',
    stage: 'Verification',
    label: 'Document Verification',
    count: 4230,
    percentage: 33.9,
    avgDaysInStage: 4,
    targetSlaDays: 5,
    description: 'DigiLocker certificate validation and OCR evidence inspection.',
  },
  {
    id: 'stage-scrutiny',
    stage: 'Scrutiny',
    label: 'Eligibility Scrutiny',
    count: 2840,
    percentage: 22.8,
    avgDaysInStage: 3,
    targetSlaDays: 4,
    description: 'Income thresholds, course eligibility, and caste criteria validation.',
  },
  {
    id: 'stage-screening',
    stage: 'Screening',
    label: 'Committee Screening',
    count: 1420,
    percentage: 11.4,
    avgDaysInStage: 5,
    targetSlaDays: 7,
    description: 'Academic merit evaluation, quota allocation, and interview ranking.',
  },
  {
    id: 'stage-selection',
    stage: 'Selection',
    label: 'Sanction & Selection',
    count: 840,
    percentage: 6.7,
    avgDaysInStage: 3,
    targetSlaDays: 4,
    description: 'Final award list generation and sanction order authorization.',
  },
];

export const adminApplications: AdminApplicationRecord[] = [
  {
    applicationId: 'NFST-2026-00125',
    applicantName: 'Ramesh Padvi',
    category: 'ST',
    gender: 'Male',
    schemeId: 'national-fellowship-st',
    schemeName: 'National Fellowship for ST Students',
    academicYear: '2026–27',
    state: 'Gujarat',
    district: 'Chhota Udepur',
    institutionName: 'Gujarat University',
    course: 'Ph.D. Environmental Science',
    academicLevel: 'Doctoral (Ph.D.)',
    familyIncome: 180000,
    submittedDate: '2026-09-12',
    currentStage: 'Verification',
    status: 'Action Required',
    verificationStatus: 'Discrepancy Flagged',
    deficiencyStatus: 'Notice Issued',
    riskScore: 'Medium',
    lastActionDate: '2026-09-28',
    assignedOfficer: 'V. K. Sharma (Verification Officer)',
    notes: 'Income certificate seal blurred; re-upload requested via SMS.',
    verifiedDocsCount: 3,
    pendingDocsCount: 0,
    flaggedDocsCount: 1,
    deficiencyIssueCount: 1,
    lastNoticeDate: '2026-09-28',
    deficiencyResponseStatus: 'Pending Student Response',
  },
  {
    applicationId: 'NOS-2026-00421',
    applicantName: 'Sunita Maravi',
    category: 'ST',
    gender: 'Female',
    schemeId: 'national-overseas-st',
    schemeName: 'National Overseas Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Madhya Pradesh',
    district: 'Dhar',
    institutionName: 'University of Edinburgh (Admitted)',
    course: 'M.Sc. Renewable Energy',
    academicLevel: 'Postgraduate (Master’s)',
    familyIncome: 240000,
    submittedDate: '2026-09-18',
    currentStage: 'Verification',
    status: 'Action Required',
    verificationStatus: 'Discrepancy Flagged',
    deficiencyStatus: 'Notice Issued',
    riskScore: 'Low',
    lastActionDate: '2026-09-29',
    assignedOfficer: 'P. Nair (Desk Officer)',
    notes: 'Unconditional admission letter missing page 2.',
    verifiedDocsCount: 2,
    pendingDocsCount: 1,
    flaggedDocsCount: 1,
    deficiencyIssueCount: 1,
    lastNoticeDate: '2026-09-29',
    deficiencyResponseStatus: 'Notice Acknowledged',
  },
  {
    applicationId: 'NFST-2026-00781',
    applicantName: 'Bikram Soren',
    category: 'ST',
    gender: 'Male',
    schemeId: 'national-fellowship-st',
    schemeName: 'National Fellowship for ST Students',
    academicYear: '2026–27',
    state: 'Jharkhand',
    district: 'Ranchi',
    institutionName: 'Ranchi University',
    course: 'Ph.D. Tribal Linguistics',
    academicLevel: 'Doctoral (Ph.D.)',
    familyIncome: 160000,
    submittedDate: '2026-09-20',
    currentStage: 'Verification',
    status: 'Under Review',
    verificationStatus: 'In Progress',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-30',
    assignedOfficer: 'V. K. Sharma (Verification Officer)',
    notes: 'OCR confidence 88% on caste certificate; manual verification underway.',
    verifiedDocsCount: 3,
    pendingDocsCount: 1,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    lastNoticeDate: undefined,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'NFST-2026-01450',
    applicantName: 'Bipul Rabha',
    category: 'ST',
    gender: 'Male',
    schemeId: 'national-fellowship-st',
    schemeName: 'National Fellowship for ST Students',
    academicYear: '2026–27',
    state: 'Assam',
    district: 'Goalpara',
    institutionName: 'Gauhati University',
    course: 'Ph.D. Folklore & Tribal Culture',
    academicLevel: 'Doctoral (Ph.D.)',
    familyIncome: 155000,
    submittedDate: '2026-09-08',
    currentStage: 'Scrutiny',
    status: 'Under Review',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-27',
    assignedOfficer: 'S. K. Verma (Scrutiny Officer)',
    notes: 'Document verification cleared without discrepancy; proposal under subject scrutiny.',
    verifiedDocsCount: 4,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'PMS-2026-06230',
    applicantName: 'Kamla Netam',
    category: 'ST',
    gender: 'Female',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Chhattisgarh',
    district: 'Bastar',
    institutionName: 'Govt Kaktiya PG College',
    course: 'B.Sc. Agriculture',
    academicLevel: 'Undergraduate (Bachelor’s)',
    familyIncome: 125000,
    submittedDate: '2026-09-18',
    currentStage: 'Screening',
    status: 'Screened',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-29',
    assignedOfficer: 'R. K. Meena (Screening Lead)',
    notes: 'Screening criteria satisfied. Recommended for state sanction batch.',
    verifiedDocsCount: 4,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'NOS-2026-00840',
    applicantName: 'Tenzin Boro',
    category: 'ST',
    gender: 'Male',
    schemeId: 'national-overseas-st',
    schemeName: 'National Overseas Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Assam',
    district: 'Kokrajhar',
    institutionName: 'University of Edinburgh',
    course: 'M.Sc. Artificial Intelligence',
    academicLevel: 'Postgraduate (Master’s)',
    familyIncome: 620000,
    submittedDate: '2026-08-30',
    currentStage: 'Scrutiny',
    status: 'Rejected',
    verificationStatus: 'Failed',
    deficiencyStatus: 'Resolved',
    riskScore: 'High',
    lastActionDate: '2026-09-20',
    assignedOfficer: 'P. Nair (Desk Officer)',
    notes: 'Family income exceeds the statutory ceiling limit of INR 6,00,000 for overseas scheme.',
    verifiedDocsCount: 3,
    pendingDocsCount: 0,
    flaggedDocsCount: 2,
    deficiencyIssueCount: 1,
    lastNoticeDate: '2026-09-15',
    deficiencyResponseStatus: 'Rejection Notice Dispatched',
  },
  {
    applicationId: 'TRF-2026-00388',
    applicantName: 'Geeta Kol',
    category: 'ST',
    gender: 'Female',
    schemeId: 'tribal-research-fellowship',
    schemeName: 'Tribal Research Fellowship',
    academicYear: '2026–27',
    state: 'Madhya Pradesh',
    district: 'Rewa',
    institutionName: 'Awadhesh Pratap Singh University',
    course: 'Ph.D. Ethnomusicology & Folk Traditions',
    academicLevel: 'Doctoral (Ph.D.)',
    familyIncome: 145000,
    submittedDate: '2026-09-16',
    currentStage: 'Selection',
    status: 'Selected',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-28',
    assignedOfficer: 'Ministry Sanction Committee',
    notes: 'Selected under regional cultural preservation fellowship quota.',
    verifiedDocsCount: 5,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'PMS-2026-01044',
    applicantName: 'Ananya Meena',
    category: 'ST',
    gender: 'Female',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Rajasthan',
    district: 'Udaipur',
    institutionName: 'Mohanlal Sukhadia University',
    course: 'B.Sc. Nursing (Year II)',
    academicLevel: 'Undergraduate (Bachelor’s)',
    familyIncome: 195000,
    submittedDate: '2026-09-15',
    currentStage: 'Scrutiny',
    status: 'Under Review',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-27',
    assignedOfficer: 'S. K. Verma (Scrutiny Officer)',
    notes: 'All documents verified through DigiLocker. Proceeding with income cap check.',
    verifiedDocsCount: 4,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'PMS-2026-01582',
    applicantName: 'Karan Gavit',
    category: 'ST',
    gender: 'Male',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Maharashtra',
    district: 'Nandurbar',
    institutionName: 'Government Polytechnic',
    course: 'Diploma in Civil Engineering',
    academicLevel: 'Diploma / Certificate',
    familyIncome: 140000,
    submittedDate: '2026-09-10',
    currentStage: 'Screening',
    status: 'Screened',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-25',
    assignedOfficer: 'R. K. Meena (Screening Lead)',
    notes: 'Candidate ranked #14 in state district quota. Approved by committee.',
    verifiedDocsCount: 4,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'NFST-2026-00349',
    applicantName: 'Manju Majhi',
    category: 'ST',
    gender: 'Female',
    schemeId: 'national-fellowship-st',
    schemeName: 'National Fellowship for ST Students',
    academicYear: '2026–27',
    state: 'Odisha',
    district: 'Mayurbhanj',
    institutionName: 'Utkal University',
    course: 'Ph.D. Anthropology',
    academicLevel: 'Doctoral (Ph.D.)',
    familyIncome: 150000,
    submittedDate: '2026-09-08',
    currentStage: 'Selection',
    status: 'Selected',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-26',
    assignedOfficer: 'Ministry Sanction Committee',
    notes: 'Award letter generated; awaiting final direct benefit transfer dispatch.',
    verifiedDocsCount: 5,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'TCE-2026-00892',
    applicantName: 'Pooja Netam',
    category: 'ST',
    gender: 'Female',
    schemeId: 'top-class-st',
    schemeName: 'Top Class Education for ST Students',
    academicYear: '2026–27',
    state: 'Chhattisgarh',
    district: 'Bastar',
    institutionName: 'NIT Raipur',
    course: 'B.Tech Information Technology',
    academicLevel: 'Undergraduate (Bachelor’s)',
    familyIncome: 210000,
    submittedDate: '2026-09-22',
    currentStage: 'Scrutiny',
    status: 'Under Review',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-29',
    assignedOfficer: 'S. K. Verma (Scrutiny Officer)',
    notes: 'Institution fee structure verified. Eligible for 100% tuition waiver.',
    verifiedDocsCount: 4,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'TRF-2026-00109',
    applicantName: 'Devendra Rathwa',
    category: 'ST',
    gender: 'Male',
    schemeId: 'tribal-research-fellowship',
    schemeName: 'Tribal Research Fellowship',
    academicYear: '2026–27',
    state: 'Gujarat',
    district: 'Dahod',
    institutionName: 'Tribal Research & Training Institute',
    course: 'M.Phil. Indigenous Knowledge Systems',
    academicLevel: 'Doctoral / M.Phil.',
    familyIncome: 175000,
    submittedDate: '2026-09-24',
    currentStage: 'Verification',
    status: 'Under Review',
    verificationStatus: 'In Progress',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-30',
    assignedOfficer: 'V. K. Sharma (Verification Officer)',
    notes: 'Research proposal synopsis received. Awaiting supervisor clearance letter.',
    verifiedDocsCount: 3,
    pendingDocsCount: 1,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'NFST-2026-00914',
    applicantName: 'Arjun Munda',
    category: 'ST',
    gender: 'Male',
    schemeId: 'national-fellowship-st',
    schemeName: 'National Fellowship for ST Students',
    academicYear: '2026–27',
    state: 'Jharkhand',
    district: 'Khunti',
    institutionName: 'Birsa Agricultural University',
    course: 'Ph.D. Soil Science',
    academicLevel: 'Doctoral (Ph.D.)',
    familyIncome: 165000,
    submittedDate: '2026-09-05',
    currentStage: 'Disbursement',
    status: 'Sanctioned',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-29',
    assignedOfficer: 'Finance Desk',
    notes: 'PFMS validation successful; DBT credit scheduled for 5th Oct 2026.',
    verifiedDocsCount: 5,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'PMS-2026-02103',
    applicantName: 'Priya Gamit',
    category: 'ST',
    gender: 'Female',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Gujarat',
    district: 'Tapi',
    institutionName: 'Surat Medical College',
    course: 'MBBS (Year I)',
    academicLevel: 'Undergraduate (Bachelor’s)',
    familyIncome: 220000,
    submittedDate: '2026-09-14',
    currentStage: 'Verification',
    status: 'Action Required',
    verificationStatus: 'Discrepancy Flagged',
    deficiencyStatus: 'Student Resubmitted',
    riskScore: 'Medium',
    lastActionDate: '2026-09-30',
    assignedOfficer: 'V. K. Sharma (Verification Officer)',
    notes: 'Resubmitted caste certificate with digital signature barcode. Pending re-inspection.',
    verifiedDocsCount: 3,
    pendingDocsCount: 1,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 1,
    lastNoticeDate: '2026-09-22',
    deficiencyResponseStatus: 'Resubmitted for Review',
  },
  {
    applicationId: 'NOS-2026-00512',
    applicantName: 'Lakhan Tirkey',
    category: 'ST',
    gender: 'Male',
    schemeId: 'national-overseas-st',
    schemeName: 'National Overseas Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Odisha',
    district: 'Sundargarh',
    institutionName: 'University of Melbourne (Admitted)',
    course: 'Master of Public Health',
    academicLevel: 'Postgraduate (Master’s)',
    familyIncome: 350000,
    submittedDate: '2026-09-19',
    currentStage: 'Scrutiny',
    status: 'Under Review',
    verificationStatus: 'Verified',
    deficiencyStatus: 'Resolved',
    riskScore: 'Low',
    lastActionDate: '2026-09-29',
    assignedOfficer: 'P. Nair (Desk Officer)',
    notes: 'Deficiency resolved; valid GRE and IELTS scorecards verified with ETS portal.',
    verifiedDocsCount: 5,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    lastNoticeDate: '2026-09-23',
    deficiencyResponseStatus: 'Resolved',
  },
  {
    applicationId: 'TCE-2026-01120',
    applicantName: 'Sanjay Badole',
    category: 'ST',
    gender: 'Male',
    schemeId: 'top-class-st',
    schemeName: 'Top Class Education for ST Students',
    academicYear: '2026–27',
    state: 'Madhya Pradesh',
    district: 'Barwani',
    institutionName: 'IIM Indore',
    course: 'Post Graduate Programme in Management (PGP)',
    academicLevel: 'Postgraduate (Master’s)',
    familyIncome: 245000,
    submittedDate: '2026-09-02',
    currentStage: 'Selection',
    status: 'Selected',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-25',
    assignedOfficer: 'Ministry Sanction Committee',
    notes: 'Top Class quota candidate ranked #3 in Management discipline.',
    verifiedDocsCount: 5,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'PMS-2026-03480',
    applicantName: 'Kavita Dhurve',
    category: 'ST',
    gender: 'Female',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Madhya Pradesh',
    district: 'Mandla',
    institutionName: 'Rani Durgavati Vishwavidyalaya',
    course: 'B.A. Political Science',
    academicLevel: 'Undergraduate (Bachelor’s)',
    familyIncome: 95000,
    submittedDate: '2026-09-26',
    currentStage: 'Submitted',
    status: 'Under Review',
    verificationStatus: 'Pending',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-26',
    assignedOfficer: 'Unassigned',
    notes: 'Fresh submission queued for automated document verification pipeline.',
    verifiedDocsCount: 0,
    pendingDocsCount: 4,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'TRF-2026-00240',
    applicantName: 'Rohit Kujur',
    category: 'ST',
    gender: 'Male',
    schemeId: 'tribal-research-fellowship',
    schemeName: 'Tribal Research Fellowship',
    academicYear: '2026–27',
    state: 'Odisha',
    district: 'Koraput',
    institutionName: 'Central University of Odisha',
    course: 'Ph.D. Biodiversity & Tribal Ethnobotany',
    academicLevel: 'Doctoral (Ph.D.)',
    familyIncome: 140000,
    submittedDate: '2026-09-11',
    currentStage: 'Screening',
    status: 'Screened',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-28',
    assignedOfficer: 'R. K. Meena (Screening Lead)',
    notes: 'Field research methodology approved by academic evaluation panel.',
    verifiedDocsCount: 4,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'NFST-2026-01205',
    applicantName: 'Nisha Vasave',
    category: 'ST',
    gender: 'Female',
    schemeId: 'national-fellowship-st',
    schemeName: 'National Fellowship for ST Students',
    academicYear: '2026–27',
    state: 'Maharashtra',
    district: 'Gadchiroli',
    institutionName: 'Gondwana University',
    course: 'Ph.D. Forest Ecology & Tribal Economy',
    academicLevel: 'Doctoral (Ph.D.)',
    familyIncome: 130000,
    submittedDate: '2026-09-21',
    currentStage: 'Verification',
    status: 'Under Review',
    verificationStatus: 'In Progress',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-30',
    assignedOfficer: 'V. K. Sharma (Verification Officer)',
    notes: 'DigiLocker marksheet matched; validating institutional enrollment cert.',
    verifiedDocsCount: 3,
    pendingDocsCount: 1,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'PMS-2026-04189',
    applicantName: 'Deepak Bhil',
    category: 'ST',
    gender: 'Male',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Rajasthan',
    district: 'Banswara',
    institutionName: 'Govt Engineering College Banswara',
    course: 'B.Tech Electrical Engineering',
    academicLevel: 'Undergraduate (Bachelor’s)',
    familyIncome: 160000,
    submittedDate: '2026-09-17',
    currentStage: 'Verification',
    status: 'Action Required',
    verificationStatus: 'Discrepancy Flagged',
    deficiencyStatus: 'Escalated',
    riskScore: 'High',
    lastActionDate: '2026-09-29',
    assignedOfficer: 'V. K. Sharma (Verification Officer)',
    notes: 'Income certificate issued in 2022; current valid financial year cert required.',
    verifiedDocsCount: 2,
    pendingDocsCount: 0,
    flaggedDocsCount: 2,
    deficiencyIssueCount: 2,
    lastNoticeDate: '2026-09-21',
    deficiencyResponseStatus: 'Escalated (No Response in 8 days)',
  },
  {
    applicationId: 'NOS-2026-00688',
    applicantName: 'Sarita Pangi',
    category: 'ST',
    gender: 'Female',
    schemeId: 'national-overseas-st',
    schemeName: 'National Overseas Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Odisha',
    district: 'Rayagada',
    institutionName: 'Oxford University (Offer Received)',
    course: 'M.St. Social Anthropology',
    academicLevel: 'Postgraduate (Master’s)',
    familyIncome: 290000,
    submittedDate: '2026-09-09',
    currentStage: 'Selection',
    status: 'Selected',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-26',
    assignedOfficer: 'Ministry Sanction Committee',
    notes: 'Overseas scholarship granted subject to visa clearance verification.',
    verifiedDocsCount: 6,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'TCE-2026-01540',
    applicantName: 'Vikram Mandavi',
    category: 'ST',
    gender: 'Male',
    schemeId: 'top-class-st',
    schemeName: 'Top Class Education for ST Students',
    academicYear: '2026–27',
    state: 'Chhattisgarh',
    district: 'Dantewada',
    institutionName: 'AIIMS Raipur',
    course: 'MBBS (Year II)',
    academicLevel: 'Undergraduate (Bachelor’s)',
    familyIncome: 185000,
    submittedDate: '2026-09-13',
    currentStage: 'Screening',
    status: 'Screened',
    verificationStatus: 'Verified',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-27',
    assignedOfficer: 'R. K. Meena (Screening Lead)',
    notes: 'Academic standing top 5 percentile; certified by Dean of Academic Affairs.',
    verifiedDocsCount: 5,
    pendingDocsCount: 0,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
  {
    applicationId: 'PMS-2026-05620',
    applicantName: 'Manisha Damor',
    category: 'ST',
    gender: 'Female',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    academicYear: '2026–27',
    state: 'Rajasthan',
    district: 'Dungarpur',
    institutionName: 'Govt College Dungarpur',
    course: 'B.Com Financial Accountancy',
    academicLevel: 'Undergraduate (Bachelor’s)',
    familyIncome: 110000,
    submittedDate: '2026-09-25',
    currentStage: 'Verification',
    status: 'Under Review',
    verificationStatus: 'In Progress',
    deficiencyStatus: 'None',
    riskScore: 'Low',
    lastActionDate: '2026-09-29',
    assignedOfficer: 'V. K. Sharma (Verification Officer)',
    notes: 'Awaiting domicile certificate digital sign cross-check with Jan Soochna Portal.',
    verifiedDocsCount: 3,
    pendingDocsCount: 1,
    flaggedDocsCount: 0,
    deficiencyIssueCount: 0,
    deficiencyResponseStatus: 'None',
  },
];

export const recentAdminActivity: AdminActivityLog[] = [
  {
    id: 'act-001',
    timestamp: '10 mins ago',
    activity: 'Deficiency Notice Dispatched',
    applicationId: 'NFST-2026-00125',
    applicantName: 'Ramesh Padvi',
    actor: 'V. K. Sharma',
    role: 'Verification Officer',
    status: 'Warning',
    details: 'Requested re-upload of legible family income certificate within 15 calendar days.',
  },
  {
    id: 'act-002',
    timestamp: '25 mins ago',
    activity: 'DigiLocker Batch Verification',
    applicationId: 'PMS-2026-01044',
    applicantName: 'Ananya Meena',
    actor: 'Automated Service',
    role: 'API Integration',
    status: 'Success',
    details: 'Caste certificate verified directly against State Tribal Registry with 100% hash match.',
  },
  {
    id: 'act-003',
    timestamp: '1 hour ago',
    activity: 'Screening Candidate Approved',
    applicationId: 'PMS-2026-01582',
    applicantName: 'Karan Gavit',
    actor: 'R. K. Meena',
    role: 'Screening Lead',
    status: 'Success',
    details: 'Candidate scored 89.4/100 in merit composite; advanced to Selection Desk.',
  },
  {
    id: 'act-004',
    timestamp: '2 hours ago',
    activity: 'Discrepancy Escalation',
    applicationId: 'NOS-2026-00421',
    applicantName: 'Sunita Maravi',
    actor: 'P. Nair',
    role: 'Desk Officer',
    status: 'Action',
    details: 'Applicant flagged for incomplete admission documentation. System cure clock started.',
  },
  {
    id: 'act-005',
    timestamp: '3 hours ago',
    activity: 'Sanction Batch Generated',
    applicationId: 'NFST-2026-00349',
    applicantName: 'Manju Majhi',
    actor: 'Ministry Committee',
    role: 'Sanction Authority',
    status: 'Success',
    details: 'Sanction batch #SB-2026-09-Q3 created containing 84 verified fellowship candidates.',
  },
];

export const adminSchemeSummaries: AdminSchemeSummary[] = [
  {
    schemeId: 'national-fellowship-st',
    schemeName: 'National Fellowship for ST Students',
    category: 'Fellowship',
    totalSlots: 1000,
    applications: 3840,
    underReview: 1420,
    deficiencies: 184,
    selected: 420,
    sanctionedCount: 380,
    budgetAllocated: '₹22.50 Cr',
    budgetUtilized: '₹14.20 Cr',
    deadline: '30 Nov 2026',
    status: 'Open',
  },
  {
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    category: 'Scholarship',
    totalSlots: 8500,
    applications: 6120,
    underReview: 1980,
    deficiencies: 312,
    selected: 820,
    sanctionedCount: 710,
    budgetAllocated: '₹35.00 Cr',
    budgetUtilized: '₹21.40 Cr',
    deadline: '15 Dec 2026',
    status: 'Open',
  },
  {
    schemeId: 'national-overseas-st',
    schemeName: 'National Overseas Scholarship for ST Students',
    category: 'Scholarship',
    totalSlots: 100,
    applications: 480,
    underReview: 180,
    deficiencies: 44,
    selected: 45,
    sanctionedCount: 38,
    budgetAllocated: '₹12.00 Cr',
    budgetUtilized: '₹8.60 Cr',
    deadline: '15 Nov 2026',
    status: 'Open',
  },
  {
    schemeId: 'top-class-st',
    schemeName: 'Top Class Education for ST Students',
    category: 'Scholarship',
    totalSlots: 500,
    applications: 1240,
    underReview: 410,
    deficiencies: 52,
    selected: 95,
    sanctionedCount: 82,
    budgetAllocated: '₹8.50 Cr',
    budgetUtilized: '₹3.40 Cr',
    deadline: '31 Oct 2026',
    status: 'Open',
  },
  {
    schemeId: 'tribal-research-fellowship',
    schemeName: 'Tribal Research Fellowship',
    category: 'Fellowship',
    totalSlots: 250,
    applications: 770,
    underReview: 240,
    deficiencies: 32,
    selected: 40,
    sanctionedCount: 30,
    budgetAllocated: '₹4.50 Cr',
    budgetUtilized: '₹1.00 Cr',
    deadline: '31 Jan 2027',
    status: 'Upcoming',
  },
];

export const geographicDistributionData: StateGeographicData[] = [
  {
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    applicationCount: 2640,
    verificationPending: 610,
    deficiencyCount: 142,
    selectedCount: 310,
    intensity: 'Very High',
    districts: [
      { district: 'Dhar', applicationCount: 680, verificationPending: 160, deficiencyCount: 38, selectedCount: 82, intensity: 'Very High' },
      { district: 'Barwani', applicationCount: 590, verificationPending: 140, deficiencyCount: 31, selectedCount: 68, intensity: 'High' },
      { district: 'Jhabua', applicationCount: 540, verificationPending: 120, deficiencyCount: 29, selectedCount: 62, intensity: 'High' },
      { district: 'Alirajpur', applicationCount: 460, verificationPending: 110, deficiencyCount: 26, selectedCount: 54, intensity: 'Medium' },
      { district: 'Mandla', applicationCount: 370, verificationPending: 80, deficiencyCount: 18, selectedCount: 44, intensity: 'Medium' },
    ],
  },
  {
    state: 'Odisha',
    stateCode: 'OD',
    applicationCount: 2180,
    verificationPending: 520,
    deficiencyCount: 118,
    selectedCount: 260,
    intensity: 'Very High',
    districts: [
      { district: 'Mayurbhanj', applicationCount: 710, verificationPending: 170, deficiencyCount: 39, selectedCount: 85, intensity: 'Very High' },
      { district: 'Sundargarh', applicationCount: 580, verificationPending: 130, deficiencyCount: 32, selectedCount: 70, intensity: 'High' },
      { district: 'Koraput', applicationCount: 490, verificationPending: 120, deficiencyCount: 27, selectedCount: 58, intensity: 'High' },
      { district: 'Rayagada', applicationCount: 400, verificationPending: 100, deficiencyCount: 20, selectedCount: 47, intensity: 'Medium' },
    ],
  },
  {
    state: 'Jharkhand',
    stateCode: 'JH',
    applicationCount: 1940,
    verificationPending: 440,
    deficiencyCount: 96,
    selectedCount: 230,
    intensity: 'High',
    districts: [
      { district: 'Ranchi', applicationCount: 620, verificationPending: 140, deficiencyCount: 31, selectedCount: 74, intensity: 'High' },
      { district: 'West Singhbhum', applicationCount: 530, verificationPending: 120, deficiencyCount: 26, selectedCount: 63, intensity: 'High' },
      { district: 'Gumla', applicationCount: 430, verificationPending: 100, deficiencyCount: 21, selectedCount: 51, intensity: 'Medium' },
      { district: 'Dumka', applicationCount: 360, verificationPending: 80, deficiencyCount: 18, selectedCount: 42, intensity: 'Medium' },
    ],
  },
  {
    state: 'Gujarat',
    stateCode: 'GJ',
    applicationCount: 1680,
    verificationPending: 380,
    deficiencyCount: 84,
    selectedCount: 195,
    intensity: 'High',
    districts: [
      { district: 'Chhota Udepur', applicationCount: 510, verificationPending: 120, deficiencyCount: 26, selectedCount: 60, intensity: 'High' },
      { district: 'Dahod', applicationCount: 480, verificationPending: 110, deficiencyCount: 24, selectedCount: 56, intensity: 'High' },
      { district: 'Panchmahal', applicationCount: 370, verificationPending: 80, deficiencyCount: 19, selectedCount: 43, intensity: 'Medium' },
      { district: 'Tapi', applicationCount: 320, verificationPending: 70, deficiencyCount: 15, selectedCount: 36, intensity: 'Medium' },
    ],
  },
  {
    state: 'Rajasthan',
    stateCode: 'RJ',
    applicationCount: 1490,
    verificationPending: 330,
    deficiencyCount: 72,
    selectedCount: 175,
    intensity: 'High',
    districts: [
      { district: 'Udaipur', applicationCount: 490, verificationPending: 110, deficiencyCount: 24, selectedCount: 58, intensity: 'High' },
      { district: 'Banswara', applicationCount: 420, verificationPending: 90, deficiencyCount: 20, selectedCount: 49, intensity: 'Medium' },
      { district: 'Dungarpur', applicationCount: 360, verificationPending: 80, deficiencyCount: 17, selectedCount: 42, intensity: 'Medium' },
      { district: 'Pratapgarh', applicationCount: 220, verificationPending: 50, deficiencyCount: 11, selectedCount: 26, intensity: 'Low' },
    ],
  },
  {
    state: 'Maharashtra',
    stateCode: 'MH',
    applicationCount: 1320,
    verificationPending: 290,
    deficiencyCount: 64,
    selectedCount: 150,
    intensity: 'Medium',
    districts: [
      { district: 'Nandurbar', applicationCount: 490, verificationPending: 110, deficiencyCount: 24, selectedCount: 56, intensity: 'High' },
      { district: 'Gadchiroli', applicationCount: 380, verificationPending: 80, deficiencyCount: 18, selectedCount: 43, intensity: 'Medium' },
      { district: 'Palghar', applicationCount: 280, verificationPending: 60, deficiencyCount: 13, selectedCount: 31, intensity: 'Low' },
      { district: 'Nashik (Tribal Pockets)', applicationCount: 170, verificationPending: 40, deficiencyCount: 9, selectedCount: 20, intensity: 'Low' },
    ],
  },
  {
    state: 'Chhattisgarh',
    stateCode: 'CG',
    applicationCount: 1200,
    verificationPending: 270,
    deficiencyCount: 48,
    selectedCount: 100,
    intensity: 'Medium',
    districts: [
      { district: 'Bastar', applicationCount: 450, verificationPending: 100, deficiencyCount: 18, selectedCount: 38, intensity: 'Medium' },
      { district: 'Dantewada', applicationCount: 390, verificationPending: 90, deficiencyCount: 16, selectedCount: 33, intensity: 'Medium' },
      { district: 'Kanker', applicationCount: 360, verificationPending: 80, deficiencyCount: 14, selectedCount: 29, intensity: 'Medium' },
    ],
  },
];

export function getAdminDashboardMetrics(): AdminDashboardMetrics {
  return adminDashboardMetrics;
}

export function getAdminApplications(): AdminApplicationRecord[] {
  return adminApplications;
}

export function getAdminApplicationById(id: string): AdminApplicationRecord | undefined {
  return adminApplications.find((app) => app.applicationId === id);
}

export function getAdminWorkflowStages(): WorkflowStageSummary[] {
  return adminWorkflowStages;
}

export function getRecentAdminActivity(): AdminActivityLog[] {
  return recentAdminActivity;
}

export function getAdminSchemeSummaries(): AdminSchemeSummary[] {
  return adminSchemeSummaries;
}

export function getGeographicDistribution(): StateGeographicData[] {
  return geographicDistributionData;
}

export function getGeographicDistributionByState(stateCode: string): StateGeographicData | undefined {
  return geographicDistributionData.find(
    (item) => item.stateCode.toLowerCase() === stateCode.toLowerCase()
  );
}