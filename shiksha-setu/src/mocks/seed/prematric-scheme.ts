import type { SchemeConfig } from '@/types';

// ─── Pre-Matric Scheme ────────────────────────────────────────────────────────
// Guardian-led application (for students below Class IX-X).
// Institution-level verification first, no committee.
// School documents, family-income-centric, simpler workflow.

export const preMatricScheme: SchemeConfig = {
  id: 'scheme-prematric',
  code: 'PM-ST-2024',
  slug: 'pre-matric-scholarship-st',
  category: 'pre-matric',
  name: { en: 'Pre-Matric Scholarship for ST Students', hi: 'अनुसूचित जनजाति छात्र प्री-मैट्रिक छात्रवृत्ति' },
  tagline: { en: 'Supporting tribal students from Class I to X', hi: 'कक्षा I से X तक जनजातीय छात्रों का समर्थन' },
  icon: 'School',
  status: 'published',
  version: { number: 5, publishedAt: '2024-06-15', publishedBy: 'scheme_admin', changeNote: 'Revised maintenance allowance rates' },
  applicantType: 'guardian-led', // parent/guardian applies on behalf of student

  window: { opensAt: '2024-08-01', closesAt: '2024-11-30' },

  benefits: [
    { icon: 'IndianRupee', label: { en: 'Day Scholar Allowance', hi: 'दिवा छात्र भत्ता' }, amount: 500, unit: 'per month' },
    { icon: 'Home', label: { en: 'Hosteller Allowance', hi: 'छात्रावास छात्र भत्ता' }, amount: 800, unit: 'per month' },
    { icon: 'BookOpen', label: { en: 'Ad hoc Grant', hi: 'तदर्थ अनुदान' }, amount: 1500, unit: 'per year' },
  ],

  seats: {
    total: 50000, // Illustrative. Actual as per annual scheme notification.
    quotas: [
      { key: 'girls', label: { en: 'Girls', hi: 'बालिका' }, percentage: 50 },
      { key: 'pvtg', label: { en: 'PVTG', hi: 'पीवीटीजी' }, percentage: 10 },
    ],
  },

  sections: [
    {
      key: 'student_details',
      label: { en: 'Student Details', hi: 'छात्र विवरण' },
      fields: [
        { key: 'studentName', label: { en: "Student's Full Name", hi: 'छात्र का पूरा नाम' }, type: 'text', required: true },
        { key: 'studentDob', label: { en: 'Date of Birth', hi: 'जन्म तिथि' }, type: 'date', required: true },
        { key: 'gender', label: { en: 'Gender', hi: 'लिंग' }, type: 'select', required: true, options: [
          { value: 'male', label: { en: 'Male', hi: 'पुरुष' } },
          { value: 'female', label: { en: 'Female', hi: 'महिला' } },
          { value: 'other', label: { en: 'Other', hi: 'अन्य' } },
        ] },
        { key: 'tribe', label: { en: 'Scheduled Tribe', hi: 'अनुसूचित जनजाति' }, type: 'tribe', required: true },
        { key: 'isPvtg', label: { en: 'PVTG?', hi: 'पीवीटीजी?' }, type: 'boolean', required: false },
        { key: 'isPwd', label: { en: 'Person with Disability?', hi: 'दिव्यांग?' }, type: 'boolean', required: false },
        { key: 'isHosteller', label: { en: 'Hostel Resident?', hi: 'छात्रावास में रहते हैं?' }, type: 'boolean', required: true },
      ],
    },
    {
      key: 'guardian_details',
      label: { en: 'Parent / Guardian Details', hi: 'माता-पिता / अभिभावक विवरण' },
      fields: [
        { key: 'guardianName', label: { en: 'Guardian Full Name', hi: 'अभिभावक का पूरा नाम' }, type: 'text', required: true, prefillFrom: { source: 'profile', path: 'name' } },
        { key: 'guardianRelation', label: { en: 'Relation to Student', hi: 'छात्र से संबंध' }, type: 'select', required: true, options: [
          { value: 'father', label: { en: 'Father', hi: 'पिता' } },
          { value: 'mother', label: { en: 'Mother', hi: 'माता' } },
          { value: 'legal_guardian', label: { en: 'Legal Guardian', hi: 'कानूनी अभिभावक' } },
        ] },
        { key: 'guardianMobile', label: { en: 'Guardian Mobile', hi: 'अभिभावक मोबाइल' }, type: 'phone', required: true },
        { key: 'guardianAadhaarMasked', label: { en: 'Aadhaar (last 4 digits)', hi: 'आधार (अंतिम 4 अंक)' }, type: 'text', required: true, helper: { en: 'We only store the last 4 digits for verification', hi: 'सत्यापन के लिए हम केवल अंतिम 4 अंक संग्रहीत करते हैं' } },
      ],
    },
    {
      key: 'school_details',
      label: { en: 'School Details', hi: 'स्कूल विवरण' },
      fields: [
        { key: 'schoolName', label: { en: 'School Name', hi: 'स्कूल का नाम' }, type: 'text', required: true },
        { key: 'schoolCode', label: { en: 'DISE / U-DISE Code', hi: 'डाईस / यू-डाईस कोड' }, type: 'text', required: true, helper: { en: 'Unique school identification code', hi: 'विद्यालय की विशिष्ट पहचान संख्या' } },
        { key: 'schoolDistrict', label: { en: 'District', hi: 'जिला' }, type: 'text', required: true },
        { key: 'schoolState', label: { en: 'State', hi: 'राज्य' }, type: 'select', required: true, options: [
          { value: 'JH', label: { en: 'Jharkhand', hi: 'झारखंड' } },
          { value: 'OD', label: { en: 'Odisha', hi: 'ओडिशा' } },
          { value: 'MP', label: { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश' } },
          { value: 'CG', label: { en: 'Chhattisgarh', hi: 'छत्तीसगढ़' } },
          { value: 'MH', label: { en: 'Maharashtra', hi: 'महाराष्ट्र' } },
          { value: 'AS', label: { en: 'Assam', hi: 'असम' } },
          { value: 'RJ', label: { en: 'Rajasthan', hi: 'राजस्थान' } },
          { value: 'GJ', label: { en: 'Gujarat', hi: 'गुजरात' } },
        ] },
        { key: 'currentClass', label: { en: 'Current Class', hi: 'वर्तमान कक्षा' }, type: 'select', required: true, options: [
          { value: '1', label: { en: 'Class I', hi: 'कक्षा I' } },
          { value: '2', label: { en: 'Class II', hi: 'कक्षा II' } },
          { value: '3', label: { en: 'Class III', hi: 'कक्षा III' } },
          { value: '4', label: { en: 'Class IV', hi: 'कक्षा IV' } },
          { value: '5', label: { en: 'Class V', hi: 'कक्षा V' } },
          { value: '6', label: { en: 'Class VI', hi: 'कक्षा VI' } },
          { value: '7', label: { en: 'Class VII', hi: 'कक्षा VII' } },
          { value: '8', label: { en: 'Class VIII', hi: 'कक्षा VIII' } },
          { value: '9', label: { en: 'Class IX', hi: 'कक्षा IX' } },
          { value: '10', label: { en: 'Class X', hi: 'कक्षा X' } },
        ] },
        { key: 'previousYearMarks', label: { en: 'Previous Year Marks (%)', hi: 'पिछले वर्ष के अंक (%)' }, type: 'number', required: false, validation: { min: 0, max: 100 } },
      ],
    },
    {
      key: 'income',
      label: { en: 'Family Income', hi: 'पारिवारिक आय' },
      fields: [
        { key: 'annualFamilyIncome', label: { en: 'Annual Family Income (₹)', hi: 'वार्षिक पारिवारिक आय (₹)' }, type: 'number', required: true, validation: { min: 0, max: 500000 } },
        { key: 'incomeCertificateNo', label: { en: 'Income Certificate Number', hi: 'आय प्रमाण पत्र संख्या' }, type: 'text', required: true },
      ],
    },
    {
      key: 'bank',
      label: { en: 'Bank Details (Guardian)', hi: 'बैंक विवरण (अभिभावक)' },
      fields: [
        { key: 'bankAccountNo', label: { en: 'Bank Account Number', hi: 'बैंक खाता नंबर' }, type: 'text', required: true },
        { key: 'ifsc', label: { en: 'IFSC Code', hi: 'आईएफएससी कोड' }, type: 'text', required: true },
        { key: 'bankName', label: { en: 'Bank Name', hi: 'बैंक का नाम' }, type: 'text', required: true },
        { key: 'accountHolderName', label: { en: 'Account Holder Name', hi: 'खाता धारक का नाम' }, type: 'text', required: true },
      ],
    },
  ],

  documents: [
    {
      key: 'caste_certificate',
      label: { en: 'Caste Certificate (ST)', hi: 'जाति प्रमाण पत्र (एसटी)' },
      mandatory: true,
      acceptedSources: ['upload', 'digilocker'],
      preferredSource: 'digilocker',
      validityMonths: 60,
      ocrFields: [
        { key: 'name', label: { en: 'Name', hi: 'नाम' }, confidenceThreshold: 0.85 },
        { key: 'tribe', label: { en: 'Tribe', hi: 'जनजाति' }, confidenceThreshold: 0.80 },
      ],
      maxSizeMb: 5,
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    {
      key: 'income_certificate',
      label: { en: 'Income Certificate', hi: 'आय प्रमाण पत्र' },
      mandatory: true,
      acceptedSources: ['upload', 'digilocker'],
      preferredSource: 'digilocker',
      validityMonths: 12,
      ocrFields: [
        { key: 'income', label: { en: 'Annual Income', hi: 'वार्षिक आय' }, confidenceThreshold: 0.90 },
      ],
      maxSizeMb: 5,
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    {
      key: 'school_certificate',
      label: { en: 'School Enrollment Certificate', hi: 'विद्यालय नामांकन प्रमाण पत्र' },
      mandatory: true,
      acceptedSources: ['upload', 'institution'],
      preferredSource: 'institution',
      ocrFields: [
        { key: 'studentName', label: { en: 'Student Name', hi: 'छात्र नाम' }, confidenceThreshold: 0.85 },
        { key: 'currentClass', label: { en: 'Class', hi: 'कक्षा' }, confidenceThreshold: 0.90 },
        { key: 'schoolCode', label: { en: 'School Code', hi: 'स्कूल कोड' }, confidenceThreshold: 0.80 },
      ],
      maxSizeMb: 5,
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    {
      key: 'previous_marksheet',
      label: { en: 'Previous Year Marksheet', hi: 'पिछले वर्ष की मार्कशीट' },
      mandatory: false,
      acceptedSources: ['upload'],
      preferredSource: 'upload',
      ocrFields: [
        { key: 'marks', label: { en: 'Total Marks', hi: 'कुल अंक' }, confidenceThreshold: 0.85 },
      ],
      maxSizeMb: 5,
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      showIf: { '>=': [{ var: 'currentClass' }, '2'] },
    },
    {
      key: 'guardian_id',
      label: { en: "Guardian's Photo ID", hi: 'अभिभावक का फोटो आईडी' },
      mandatory: true,
      acceptedSources: ['digilocker', 'upload'],
      preferredSource: 'digilocker',
      ocrFields: [
        { key: 'name', label: { en: 'Name', hi: 'नाम' }, confidenceThreshold: 0.88 },
      ],
      maxSizeMb: 5,
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    {
      key: 'bank_passbook',
      label: { en: 'Bank Passbook / Cancelled Cheque', hi: 'बैंक पासबुक / रद्द चेक' },
      mandatory: true,
      acceptedSources: ['upload'],
      preferredSource: 'upload',
      ocrFields: [
        { key: 'accountNo', label: { en: 'Account Number', hi: 'खाता नंबर' }, confidenceThreshold: 0.90 },
        { key: 'ifsc', label: { en: 'IFSC', hi: 'IFSC' }, confidenceThreshold: 0.90 },
      ],
      maxSizeMb: 5,
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    {
      key: 'hostel_certificate',
      label: { en: 'Hostel Residence Certificate', hi: 'छात्रावास निवास प्रमाण पत्र' },
      mandatory: true,
      acceptedSources: ['upload', 'institution'],
      preferredSource: 'institution',
      ocrFields: [],
      maxSizeMb: 5,
      mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      showIf: { '==': [{ var: 'isHosteller' }, true] },
    },
  ],

  rules: [
    {
      key: 'st_category',
      label: { en: 'Must be Scheduled Tribe', hi: 'अनुसूचित जनजाति का सदस्य होना आवश्यक' },
      kind: 'eligibility',
      logic: { '!!': [{ var: 'tribe' }] },
      severity: 'blocking',
      explainMet: { en: 'Student belongs to a Scheduled Tribe', hi: 'छात्र अनुसूचित जनजाति से हैं' },
      explainFail: { en: 'Student must belong to a Scheduled Tribe', hi: 'छात्र को अनुसूचित जनजाति से होना चाहिए' },
      dataDeps: ['tribe'],
    },
    {
      key: 'income_limit_prematric',
      label: { en: 'Family income must not exceed ₹2.5 LPA', hi: 'पारिवारिक आय ₹2.5 लाख से अधिक नहीं होनी चाहिए' },
      kind: 'eligibility',
      logic: { '<=': [{ var: 'annualFamilyIncome' }, 250000] },
      severity: 'blocking',
      explainMet: { en: 'Family income is within the ₹2.5 LPA limit', hi: 'पारिवारिक आय ₹2.5 लाख की सीमा के भीतर है' },
      explainFail: { en: 'Family income exceeds ₹2.5 LPA limit for Pre-Matric', hi: 'प्री-मैट्रिक के लिए पारिवारिक आय ₹2.5 लाख से अधिक है' },
      dataDeps: ['annualFamilyIncome'],
    },
    {
      key: 'class_range',
      label: { en: 'Student must be in Class I–X', hi: 'छात्र कक्षा I–X में होना चाहिए' },
      kind: 'eligibility',
      logic: { 'and': [
        { '>=': [{ var: 'currentClass' }, '1'] },
        { '<=': [{ var: 'currentClass' }, '10'] },
      ] },
      severity: 'blocking',
      explainMet: { en: 'Student is in eligible class (I–X)', hi: 'छात्र पात्र कक्षा (I–X) में हैं' },
      explainFail: { en: 'Pre-Matric scholarship is for Class I to X only', hi: 'प्री-मैट्रिक छात्रवृत्ति केवल कक्षा I से X के लिए है' },
      dataDeps: ['currentClass'],
    },
    {
      key: 'school_registered',
      label: { en: 'School must have valid DISE code', hi: 'स्कूल का वैध DISE कोड होना चाहिए' },
      kind: 'document',
      logic: { '!!': [{ var: 'schoolCode' }] },
      severity: 'blocking',
      explainMet: { en: 'School has a valid DISE code', hi: 'स्कूल का वैध DISE कोड है' },
      explainFail: { en: 'School must have a valid DISE registration code', hi: 'स्कूल का वैध DISE पंजीकरण कोड होना आवश्यक है' },
      dataDeps: ['schoolCode'],
    },
    {
      key: 'attendance_requirement',
      label: { en: 'Must maintain 75% attendance', hi: '75% उपस्थिति आवश्यक' },
      kind: 'selection-gate',
      logic: { '>=': [{ var: 'attendancePct' }, 75] },
      severity: 'warning',
      explainMet: { en: 'Attendance requirement met', hi: 'उपस्थिति आवश्यकता पूरी होती है' },
      explainFail: { en: 'Attendance below 75% — may affect continuation', hi: 'उपस्थिति 75% से कम — निरंतरता प्रभावित हो सकती है' },
      dataDeps: ['attendancePct'],
    },
  ],

  workflow: {
    stages: [
      { key: 'draft', label: { en: 'Draft', hi: 'मसौदा' }, role: 'guardian', slaDays: 30, order: 0, kind: 'auto' },
      { key: 'submitted', label: { en: 'Submitted', hi: 'सबमिट' }, role: 'guardian', slaDays: 1, order: 1, kind: 'auto' },
      { key: 'school_verification', label: { en: 'School Verification', hi: 'स्कूल सत्यापन' }, role: 'institution_officer', slaDays: 7, order: 2, kind: 'human' },
      { key: 'state_approval', label: { en: 'State Approval', hi: 'राज्य अनुमोदन' }, role: 'state_officer', slaDays: 14, order: 3, kind: 'human' },
      { key: 'selected', label: { en: 'Selected', hi: 'चयनित' }, role: 'state_officer', slaDays: 0, order: 4, kind: 'auto' },
      { key: 'rejected', label: { en: 'Rejected', hi: 'अस्वीकृत' }, role: 'state_officer', slaDays: 0, order: 4, kind: 'auto' },
      { key: 'deficient', label: { en: 'Deficient', hi: 'अपूर्ण' }, role: 'institution_officer', slaDays: 15, order: 2, kind: 'human' },
    ],
    transitions: [
      { from: 'draft', to: 'submitted', allowedRoles: ['guardian', 'student', 'super_admin'], requiresReason: false },
      { from: 'submitted', to: 'school_verification', allowedRoles: ['institution_officer', 'super_admin'], requiresReason: false },
      { from: 'submitted', to: 'deficient', allowedRoles: ['institution_officer', 'state_officer', 'super_admin'], requiresReason: true },
      { from: 'school_verification', to: 'state_approval', allowedRoles: ['institution_officer', 'super_admin'], requiresReason: false },
      { from: 'school_verification', to: 'deficient', allowedRoles: ['institution_officer', 'super_admin'], requiresReason: true },
      { from: 'deficient', to: 'submitted', allowedRoles: ['guardian', 'student', 'super_admin'], requiresReason: false, label: { en: 'Resubmit', hi: 'पुनः सबमिट करें' } },
      { from: 'state_approval', to: 'selected', allowedRoles: ['state_officer', 'super_admin'], requiresReason: false },
      { from: 'state_approval', to: 'rejected', allowedRoles: ['state_officer', 'super_admin'], requiresReason: true },
    ],
  },

  selection: {
    method: 'threshold', // All eligible + income-below-threshold are selected
    criteria: [
      { key: 'income', label: { en: 'Family Income', hi: 'पारिवारिक आय' }, weight: 60, source: 'formData.annualFamilyIncome' },
      { key: 'gender', label: { en: 'Girl Child Priority', hi: 'बालिका प्राथमिकता' }, weight: 20, source: 'formData.gender' },
      { key: 'pvtg', label: { en: 'PVTG Priority', hi: 'पीवीटीजी प्राथमिकता' }, weight: 20, source: 'formData.isPvtg' },
    ],
    tieBreakers: ['annualFamilyIncome', 'studentDob'],
    quotas: [
      { key: 'girls', label: { en: 'Girls', hi: 'बालिका' }, percentage: 50, condition: { '==': [{ var: 'gender' }, 'female'] } },
      { key: 'pvtg', label: { en: 'PVTG', hi: 'पीवीटीजी' }, percentage: 10, condition: { '==': [{ var: 'isPvtg' }, true] } },
    ],
  },

  communication: {
    templates: {
      submitted: {
        subject: { en: 'Application Received – Pre-Matric Scholarship', hi: 'आवेदन प्राप्त – प्री-मैट्रिक छात्रवृत्ति' },
        body: { en: 'Dear {{guardianName}}, application for {{studentName}} ({{appId}}) received.', hi: 'प्रिय {{guardianName}}, {{studentName}} का आवेदन ({{appId}}) प्राप्त हो गया है।' },
      },
      selected: {
        subject: { en: 'Scholarship Awarded – Pre-Matric', hi: 'छात्रवृत्ति प्रदान की गई – प्री-मैट्रिक' },
        body: { en: 'Dear {{guardianName}}, {{studentName}} has been selected for the Pre-Matric scholarship.', hi: 'प्रिय {{guardianName}}, {{studentName}} को प्री-मैट्रिक छात्रवृत्ति के लिए चुना गया है।' },
      },
      deficient: {
        subject: { en: 'Action Required – Pre-Matric Application', hi: 'कार्रवाई आवश्यक – प्री-मैट्रिक आवेदन' },
        body: { en: 'Dear {{guardianName}}, application {{appId}} has deficiencies. Please rectify within 15 days.', hi: 'प्रिय {{guardianName}}, आवेदन {{appId}} में कमियां हैं। 15 दिनों में सुधारें।' },
      },
    },
  },

  postSelection: {
    tasks: [
      { key: 'bank_verify', label: { en: 'Verify Guardian Bank Account', hi: 'अभिभावक बैंक खाते का सत्यापन' }, role: 'finance_officer', daysAfterSelection: 15 },
      { key: 'attendance_report', label: { en: 'Submit Attendance Report (Half-yearly)', hi: 'उपस्थिति रिपोर्ट जमा करें (छमाही)' }, role: 'institution_officer', daysAfterSelection: 180 },
    ],
    paymentSchedule: [
      { installment: 1, label: { en: 'First Installment', hi: 'पहली किस्त' }, daysAfterSelection: 30, percentage: 50 },
      { installment: 2, label: { en: 'Second Installment', hi: 'दूसरी किस्त' }, daysAfterSelection: 210, percentage: 50 },
    ],
  },
};
