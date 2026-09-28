import type { SchemeConfig } from '@/types';

// ─── Post-Matric Scholarship ──────────────────────────────────────────────────
export const postMatricScheme: SchemeConfig = {
  id: 'scheme-postmatric',
  code: 'PM-ST-2024-XI',
  slug: 'post-matric-scholarship-st',
  category: 'post-matric',
  name: { en: 'Post-Matric Scholarship for ST Students', hi: 'अनुसूचित जनजाति पोस्ट-मैट्रिक छात्रवृत्ति' },
  tagline: { en: 'Supporting tribal students in Class XI and above', hi: 'कक्षा XI और उससे ऊपर के जनजातीय छात्रों का समर्थन' },
  icon: 'GraduationCap',
  status: 'published',
  version: { number: 2, publishedAt: '2024-05-01', publishedBy: 'scheme_admin', changeNote: 'Initial publish' },
  applicantType: 'self',
  window: { opensAt: '2024-08-15', closesAt: '2024-11-15' },
  benefits: [
    { icon: 'IndianRupee', label: { en: 'Maintenance Allowance', hi: 'रखरखाव भत्ता' }, amount: 1200, unit: 'per month' },
    { icon: 'BookOpen', label: { en: 'Reader Charges (PwD)', hi: 'पाठक शुल्क (दिव्यांग)' }, amount: 2000, unit: 'per year' },
  ],
  seats: { total: 100000, quotas: [{ key: 'girls', label: { en: 'Girls', hi: 'बालिका' }, percentage: 50 }] },
  sections: [
    {
      key: 'personal',
      label: { en: 'Personal Details', hi: 'व्यक्तिगत विवरण' },
      fields: [
        { key: 'fullName', label: { en: 'Full Name', hi: 'पूरा नाम' }, type: 'text', required: true },
        { key: 'dob', label: { en: 'Date of Birth', hi: 'जन्म तिथि' }, type: 'date', required: true },
        { key: 'gender', label: { en: 'Gender', hi: 'लिंग' }, type: 'select', required: true, options: [
          { value: 'male', label: { en: 'Male', hi: 'पुरुष' } },
          { value: 'female', label: { en: 'Female', hi: 'महिला' } },
        ] },
        { key: 'tribe', label: { en: 'Scheduled Tribe', hi: 'अनुसूचित जनजाति' }, type: 'tribe', required: true },
        { key: 'annualFamilyIncome', label: { en: 'Annual Family Income (₹)', hi: 'वार्षिक पारिवारिक आय (₹)' }, type: 'number', required: true },
      ],
    },
    {
      key: 'academic',
      label: { en: 'Academic Details', hi: 'शैक्षणिक विवरण' },
      fields: [
        { key: 'course', label: { en: 'Course / Program', hi: 'पाठ्यक्रम' }, type: 'course', required: true },
        { key: 'institution', label: { en: 'Institution', hi: 'संस्था' }, type: 'institution', required: true },
        { key: 'isHosteller', label: { en: 'Hostel Resident?', hi: 'छात्रावास में?' }, type: 'boolean', required: true },
      ],
    },
  ],
  documents: [
    { key: 'caste_certificate', label: { en: 'Caste Certificate', hi: 'जाति प्रमाण पत्र' }, mandatory: true, acceptedSources: ['upload', 'digilocker'], preferredSource: 'digilocker', ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf', 'image/jpeg'] },
    { key: 'income_certificate', label: { en: 'Income Certificate', hi: 'आय प्रमाण पत्र' }, mandatory: true, acceptedSources: ['upload', 'digilocker'], preferredSource: 'digilocker', validityMonths: 12, ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf', 'image/jpeg'] },
    { key: 'marksheet', label: { en: 'Previous Year Marksheet', hi: 'पिछले वर्ष की मार्कशीट' }, mandatory: true, acceptedSources: ['upload'], preferredSource: 'upload', ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf', 'image/jpeg'] },
  ],
  rules: [
    { key: 'st_category', label: { en: 'Must be ST', hi: 'अनुसूचित जनजाति' }, kind: 'eligibility', logic: { '!!': [{ var: 'tribe' }] }, severity: 'blocking', explainMet: { en: 'ST category verified', hi: 'एसटी श्रेणी सत्यापित' }, explainFail: { en: 'Must belong to ST category', hi: 'एसटी श्रेणी से होना आवश्यक' }, dataDeps: ['tribe'] },
    { key: 'income_limit', label: { en: 'Income ≤ ₹2.5L', hi: 'आय ≤ ₹2.5 लाख' }, kind: 'eligibility', logic: { '<=': [{ var: 'annualFamilyIncome' }, 250000] }, severity: 'blocking', explainMet: { en: 'Income within limit', hi: 'आय सीमा के भीतर' }, explainFail: { en: 'Income exceeds ₹2.5L limit', hi: 'आय ₹2.5L की सीमा से अधिक' }, dataDeps: ['annualFamilyIncome'] },
  ],
  workflow: {
    stages: [
      { key: 'draft', label: { en: 'Draft', hi: 'मसौदा' }, role: 'student', slaDays: 30, order: 0, kind: 'auto' },
      { key: 'submitted', label: { en: 'Submitted', hi: 'सबमिट' }, role: 'student', slaDays: 1, order: 1, kind: 'auto' },
      { key: 'institution_verification', label: { en: 'Institution Verification', hi: 'संस्था सत्यापन' }, role: 'institution_officer', slaDays: 7, order: 2, kind: 'human' },
      { key: 'state_approval', label: { en: 'State Approval', hi: 'राज्य अनुमोदन' }, role: 'state_officer', slaDays: 14, order: 3, kind: 'human' },
      { key: 'selected', label: { en: 'Selected', hi: 'चयनित' }, role: 'state_officer', slaDays: 0, order: 4, kind: 'auto' },
      { key: 'rejected', label: { en: 'Rejected', hi: 'अस्वीकृत' }, role: 'state_officer', slaDays: 0, order: 4, kind: 'auto' },
      { key: 'deficient', label: { en: 'Deficient', hi: 'अपूर्ण' }, role: 'institution_officer', slaDays: 15, order: 2, kind: 'human' },
    ],
    transitions: [
      { from: 'draft', to: 'submitted', allowedRoles: ['student', 'guardian', 'super_admin'], requiresReason: false },
      { from: 'submitted', to: 'institution_verification', allowedRoles: ['institution_officer', 'super_admin'], requiresReason: false },
      { from: 'submitted', to: 'deficient', allowedRoles: ['institution_officer', 'state_officer', 'super_admin'], requiresReason: true },
      { from: 'institution_verification', to: 'state_approval', allowedRoles: ['institution_officer', 'super_admin'], requiresReason: false },
      { from: 'institution_verification', to: 'deficient', allowedRoles: ['institution_officer', 'super_admin'], requiresReason: true },
      { from: 'deficient', to: 'submitted', allowedRoles: ['student', 'guardian', 'super_admin'], requiresReason: false },
      { from: 'state_approval', to: 'selected', allowedRoles: ['state_officer', 'super_admin'], requiresReason: false },
      { from: 'state_approval', to: 'rejected', allowedRoles: ['state_officer', 'super_admin'], requiresReason: true },
    ],
  },
  selection: { method: 'threshold', criteria: [{ key: 'income', label: { en: 'Income', hi: 'आय' }, weight: 100, source: 'formData.annualFamilyIncome' }], tieBreakers: ['annualFamilyIncome'], quotas: [{ key: 'girls', label: { en: 'Girls', hi: 'बालिका' }, percentage: 50 }] },
  communication: {
    templates: {
      submitted: { subject: { en: 'Application Received – Post-Matric' }, body: { en: 'Your application {{appId}} is received.' } },
      selected: { subject: { en: 'Scholarship Awarded – Post-Matric' }, body: { en: 'You have been selected.' } },
      deficient: { subject: { en: 'Action Required – Post-Matric' }, body: { en: 'Please rectify deficiencies in {{appId}}.' } },
    },
  },
  postSelection: {
    tasks: [{ key: 'bank_verify', label: { en: 'Bank Verification', hi: 'बैंक सत्यापन' }, role: 'finance_officer', daysAfterSelection: 15 }],
    paymentSchedule: [
      { installment: 1, label: { en: 'First Installment', hi: 'पहली किस्त' }, daysAfterSelection: 30, percentage: 50 },
      { installment: 2, label: { en: 'Second Installment', hi: 'दूसरी किस्त' }, daysAfterSelection: 210, percentage: 50 },
    ],
  },
};

// ─── Top Class Scholarship ────────────────────────────────────────────────────
export const topClassScheme: SchemeConfig = {
  id: 'scheme-topclass',
  code: 'TC-ST-2024',
  slug: 'top-class-scholarship-st',
  category: 'top-class',
  name: { en: 'Top Class Scholarship for ST Students', hi: 'अनुसूचित जनजाति टॉप क्लास छात्रवृत्ति' },
  tagline: { en: 'Excellence in top 100 institutions', hi: 'शीर्ष 100 संस्थानों में उत्कृष्टता' },
  icon: 'Star',
  status: 'published',
  version: { number: 1, publishedAt: '2024-06-01', publishedBy: 'scheme_admin', changeNote: 'Initial' },
  applicantType: 'self',
  window: { opensAt: '2024-09-01', closesAt: '2024-11-30' },
  benefits: [
    { icon: 'IndianRupee', label: { en: 'Full Tuition Fee', hi: 'पूर्ण शिक्षण शुल्क' }, unit: 'actual' },
    { icon: 'Home', label: { en: 'Living Expenses', hi: 'जीवन-यापन व्यय' }, amount: 3000, unit: 'per month' },
    { icon: 'Laptop', label: { en: 'Laptop Grant', hi: 'लैपटॉप अनुदान' }, amount: 45000, unit: 'once' },
  ],
  seats: { total: 1200, quotas: [{ key: 'women', label: { en: 'Women', hi: 'महिला' }, percentage: 30 }] },
  sections: [
    { key: 'personal', label: { en: 'Personal', hi: 'व्यक्तिगत' }, fields: [
      { key: 'fullName', label: { en: 'Full Name', hi: 'पूरा नाम' }, type: 'text', required: true },
      { key: 'tribe', label: { en: 'Tribe', hi: 'जनजाति' }, type: 'tribe', required: true },
      { key: 'annualFamilyIncome', label: { en: 'Annual Income (₹)', hi: 'वार्षिक आय (₹)' }, type: 'number', required: true },
    ] },
    { key: 'academic', label: { en: 'Academic', hi: 'शैक्षणिक' }, fields: [
      { key: 'institution', label: { en: 'Institution', hi: 'संस्था' }, type: 'institution', required: true },
      { key: 'course', label: { en: 'Course', hi: 'पाठ्यक्रम' }, type: 'course', required: true },
      { key: 'meritRank', label: { en: 'Entrance Rank', hi: 'प्रवेश रैंक' }, type: 'number', required: false },
    ] },
  ],
  documents: [
    { key: 'caste_certificate', label: { en: 'Caste Certificate', hi: 'जाति प्रमाण पत्र' }, mandatory: true, acceptedSources: ['upload', 'digilocker'], preferredSource: 'digilocker', ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf'] },
    { key: 'income_certificate', label: { en: 'Income Certificate', hi: 'आय प्रमाण पत्र' }, mandatory: true, acceptedSources: ['upload', 'digilocker'], preferredSource: 'digilocker', validityMonths: 12, ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf'] },
    { key: 'admission_letter', label: { en: 'Admission Letter', hi: 'प्रवेश पत्र' }, mandatory: true, acceptedSources: ['upload'], preferredSource: 'upload', ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf'] },
  ],
  rules: [
    { key: 'st_category', label: { en: 'Must be ST', hi: 'एसटी' }, kind: 'eligibility', logic: { '!!': [{ var: 'tribe' }] }, severity: 'blocking', explainMet: { en: 'ST verified', hi: 'एसटी सत्यापित' }, explainFail: { en: 'Must be ST', hi: 'एसटी होना आवश्यक' }, dataDeps: ['tribe'] },
    { key: 'income_limit', label: { en: 'Income ≤ ₹6L', hi: 'आय ≤ ₹6 लाख' }, kind: 'eligibility', logic: { '<=': [{ var: 'annualFamilyIncome' }, 600000] }, severity: 'blocking', explainMet: { en: 'Within limit', hi: 'सीमा के भीतर' }, explainFail: { en: 'Income exceeds ₹6L', hi: 'आय ₹6L से अधिक' }, dataDeps: ['annualFamilyIncome'] },
  ],
  workflow: {
    stages: [
      { key: 'draft', label: { en: 'Draft', hi: 'मसौदा' }, role: 'student', slaDays: 30, order: 0, kind: 'auto' },
      { key: 'submitted', label: { en: 'Submitted', hi: 'सबमिट' }, role: 'student', slaDays: 1, order: 1, kind: 'auto' },
      { key: 'ministry_review', label: { en: 'Ministry Review', hi: 'मंत्रालय समीक्षा' }, role: 'ministry_reviewer', slaDays: 30, order: 2, kind: 'human' },
      { key: 'selected', label: { en: 'Selected', hi: 'चयनित' }, role: 'ministry_reviewer', slaDays: 0, order: 3, kind: 'auto' },
      { key: 'rejected', label: { en: 'Rejected', hi: 'अस्वीकृत' }, role: 'ministry_reviewer', slaDays: 0, order: 3, kind: 'auto' },
    ],
    transitions: [
      { from: 'draft', to: 'submitted', allowedRoles: ['student', 'super_admin'], requiresReason: false },
      { from: 'submitted', to: 'ministry_review', allowedRoles: ['ministry_reviewer', 'super_admin'], requiresReason: false },
      { from: 'ministry_review', to: 'selected', allowedRoles: ['ministry_reviewer', 'super_admin'], requiresReason: false },
      { from: 'ministry_review', to: 'rejected', allowedRoles: ['ministry_reviewer', 'super_admin'], requiresReason: true },
    ],
  },
  selection: { method: 'rank', criteria: [{ key: 'merit', label: { en: 'Entrance Rank', hi: 'प्रवेश रैंक' }, weight: 100, source: 'formData.meritRank' }], tieBreakers: ['annualFamilyIncome'], quotas: [] },
  communication: { templates: { submitted: { subject: { en: 'Application Received' }, body: { en: 'Received {{appId}}.' } }, selected: { subject: { en: 'Selected' }, body: { en: 'Congratulations!' } }, deficient: { subject: { en: 'Action Required' }, body: { en: 'Deficiency in {{appId}}.' } } } },
  postSelection: { tasks: [], paymentSchedule: [{ installment: 1, label: { en: 'Annual', hi: 'वार्षिक' }, daysAfterSelection: 30, percentage: 100 }] },
};

// ─── NOS Scheme (National Overseas Scholarship) ───────────────────────────────
export const nosScheme: SchemeConfig = {
  id: 'scheme-nos',
  code: 'NOS-ST-2024',
  slug: 'national-overseas-scholarship-st',
  category: 'overseas',
  name: { en: 'National Overseas Scholarship for ST', hi: 'राष्ट्रीय विदेश छात्रवृत्ति एसटी' },
  tagline: { en: 'Study abroad for ST students', hi: 'जनजातीय छात्रों के लिए विदेश अध्ययन' },
  icon: 'Globe',
  status: 'published',
  version: { number: 1, publishedAt: '2024-07-01', publishedBy: 'scheme_admin', changeNote: 'Initial' },
  applicantType: 'self',
  window: { opensAt: '2024-09-15', closesAt: '2024-12-15' },
  benefits: [
    { icon: 'IndianRupee', label: { en: 'Annual Maintenance', hi: 'वार्षिक रखरखाव' }, amount: 1500000, unit: 'per year' },
    { icon: 'Plane', label: { en: 'Air Fare', hi: 'हवाई किराया' }, unit: 'actual' },
  ],
  seats: { total: 40, quotas: [{ key: 'women', label: { en: 'Women', hi: 'महिला' }, percentage: 30 }] },
  sections: [
    { key: 'personal', label: { en: 'Personal', hi: 'व्यक्तिगत' }, fields: [
      { key: 'fullName', label: { en: 'Full Name', hi: 'पूरा नाम' }, type: 'text', required: true },
      { key: 'tribe', label: { en: 'Tribe', hi: 'जनजाति' }, type: 'tribe', required: true },
      { key: 'annualFamilyIncome', label: { en: 'Annual Income', hi: 'वार्षिक आय' }, type: 'number', required: true },
    ] },
    { key: 'academic', label: { en: 'Overseas Program', hi: 'विदेश कार्यक्रम' }, fields: [
      { key: 'foreignUniversity', label: { en: 'Foreign University Name', hi: 'विदेशी विश्वविद्यालय का नाम' }, type: 'text', required: true },
      { key: 'foreignCountry', label: { en: 'Country', hi: 'देश' }, type: 'text', required: true },
      { key: 'programName', label: { en: 'Program / Degree', hi: 'कार्यक्रम / डिग्री' }, type: 'text', required: true },
      { key: 'admissionLetterDate', label: { en: 'Admission Offer Date', hi: 'प्रवेश प्रस्ताव तिथि' }, type: 'date', required: true },
    ] },
  ],
  documents: [
    { key: 'caste_certificate', label: { en: 'Caste Certificate', hi: 'जाति प्रमाण पत्र' }, mandatory: true, acceptedSources: ['upload', 'digilocker'], preferredSource: 'digilocker', ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf'] },
    { key: 'offer_letter', label: { en: 'University Offer Letter', hi: 'विश्वविद्यालय प्रस्ताव पत्र' }, mandatory: true, acceptedSources: ['upload'], preferredSource: 'upload', ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf'] },
    { key: 'passport', label: { en: 'Valid Passport', hi: 'वैध पासपोर्ट' }, mandatory: true, acceptedSources: ['upload', 'digilocker'], preferredSource: 'digilocker', ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf', 'image/jpeg'] },
  ],
  rules: [
    { key: 'st_category', label: { en: 'Must be ST', hi: 'एसटी' }, kind: 'eligibility', logic: { '!!': [{ var: 'tribe' }] }, severity: 'blocking', explainMet: { en: 'ST verified', hi: 'एसटी' }, explainFail: { en: 'Must be ST', hi: 'एसटी होना आवश्यक' }, dataDeps: ['tribe'] },
    { key: 'income_limit', label: { en: 'Income ≤ ₹6L', hi: 'आय ≤ ₹6 लाख' }, kind: 'eligibility', logic: { '<=': [{ var: 'annualFamilyIncome' }, 600000] }, severity: 'blocking', explainMet: { en: 'Within limit', hi: 'सीमा के भीतर' }, explainFail: { en: 'Income exceeds ₹6L', hi: 'आय ₹6L से अधिक' }, dataDeps: ['annualFamilyIncome'] },
  ],
  workflow: {
    stages: [
      { key: 'draft', label: { en: 'Draft', hi: 'मसौदा' }, role: 'student', slaDays: 30, order: 0, kind: 'auto' },
      { key: 'submitted', label: { en: 'Submitted', hi: 'सबमिट' }, role: 'student', slaDays: 1, order: 1, kind: 'auto' },
      { key: 'ministry_review', label: { en: 'Ministry Review', hi: 'मंत्रालय समीक्षा' }, role: 'ministry_reviewer', slaDays: 45, order: 2, kind: 'human' },
      { key: 'committee_selection', label: { en: 'Selection Committee', hi: 'चयन समिति' }, role: 'selection_committee', slaDays: 30, order: 3, kind: 'committee' },
      { key: 'selected', label: { en: 'Selected', hi: 'चयनित' }, role: 'selection_committee', slaDays: 0, order: 4, kind: 'auto' },
      { key: 'rejected', label: { en: 'Rejected', hi: 'अस्वीकृत' }, role: 'ministry_reviewer', slaDays: 0, order: 4, kind: 'auto' },
    ],
    transitions: [
      { from: 'draft', to: 'submitted', allowedRoles: ['student', 'super_admin'], requiresReason: false },
      { from: 'submitted', to: 'ministry_review', allowedRoles: ['ministry_reviewer', 'super_admin'], requiresReason: false },
      { from: 'ministry_review', to: 'committee_selection', allowedRoles: ['ministry_reviewer', 'super_admin'], requiresReason: false },
      { from: 'ministry_review', to: 'rejected', allowedRoles: ['ministry_reviewer', 'super_admin'], requiresReason: true },
      { from: 'committee_selection', to: 'selected', allowedRoles: ['selection_committee', 'super_admin'], requiresReason: false },
      { from: 'committee_selection', to: 'rejected', allowedRoles: ['selection_committee', 'super_admin'], requiresReason: true },
    ],
  },
  selection: { method: 'rank', criteria: [{ key: 'merit', label: { en: 'Academic Merit', hi: 'शैक्षणिक योग्यता' }, weight: 60, source: 'manual_score' }, { key: 'interview', label: { en: 'Interview Score', hi: 'साक्षात्कार अंक' }, weight: 40, source: 'manual_score' }], tieBreakers: ['annualFamilyIncome'], quotas: [] },
  communication: { templates: { submitted: { subject: { en: 'Application Received' }, body: { en: 'Received {{appId}}.' } }, selected: { subject: { en: 'Selected' }, body: { en: 'Congratulations!' } }, deficient: { subject: { en: 'Action Required' }, body: { en: 'Deficiency in {{appId}}.' } } } },
  postSelection: { tasks: [], paymentSchedule: [{ installment: 1, label: { en: 'Annual', hi: 'वार्षिक' }, daysAfterSelection: 60, percentage: 100 }] },
};

// ─── Blank Template Scheme ────────────────────────────────────────────────────
export const blankTemplateScheme: SchemeConfig = {
  id: 'scheme-template',
  code: 'TEMPLATE-001',
  slug: 'blank-scheme-template',
  category: 'other',
  name: { en: 'Blank Scheme Template', hi: 'रिक्त योजना टेम्पलेट' },
  tagline: { en: 'Start building a new scheme from this template', hi: 'इस टेम्पलेट से नई योजना बनाएं' },
  icon: 'FileTemplate',
  status: 'draft',
  version: { number: 1, publishedAt: '', publishedBy: 'scheme_admin', changeNote: 'Template' },
  applicantType: 'self',
  window: { opensAt: '', closesAt: '' },
  benefits: [],
  sections: [
    { key: 'personal', label: { en: 'Personal Details', hi: 'व्यक्तिगत विवरण' }, fields: [
      { key: 'fullName', label: { en: 'Full Name', hi: 'पूरा नाम' }, type: 'text', required: true },
      { key: 'tribe', label: { en: 'Tribe', hi: 'जनजाति' }, type: 'tribe', required: true },
    ] },
  ],
  documents: [
    { key: 'caste_certificate', label: { en: 'Caste Certificate', hi: 'जाति प्रमाण पत्र' }, mandatory: true, acceptedSources: ['upload', 'digilocker'], preferredSource: 'digilocker', ocrFields: [], maxSizeMb: 5, mimeTypes: ['application/pdf'] },
  ],
  rules: [],
  workflow: {
    stages: [
      { key: 'draft', label: { en: 'Draft', hi: 'मसौदा' }, role: 'student', slaDays: 30, order: 0, kind: 'auto' },
      { key: 'submitted', label: { en: 'Submitted', hi: 'सबमिट' }, role: 'student', slaDays: 1, order: 1, kind: 'auto' },
    ],
    transitions: [
      { from: 'draft', to: 'submitted', allowedRoles: ['student'], requiresReason: false },
    ],
  },
  selection: { method: 'rank', criteria: [], tieBreakers: [], quotas: [] },
  communication: { templates: { submitted: { subject: { en: 'Application Received' }, body: { en: 'Received.' } }, selected: { subject: { en: 'Selected' }, body: { en: 'Congratulations!' } }, deficient: { subject: { en: 'Action Required' }, body: { en: 'Deficiency.' } } } },
  postSelection: { tasks: [], paymentSchedule: [] },
};
