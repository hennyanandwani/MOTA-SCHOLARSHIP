export interface HelpCategoryItem {
  id: string;
  title: string;
  description: string;
  iconName: 'FileText' | 'FileCheck' | 'ClipboardCheck' | 'GraduationCap' | 'User' | 'LifeBuoy';
  topics: string[];
}

export interface PopularTopicItem {
  id: string;
  title: string;
  category: string;
  badgeText: string;
  summary: string;
  details: string[];
  quickLink?: {
    label: string;
    href: string;
  };
}

export interface FAQItem {
  id: string;
  categoryId: string;
  categoryName: string;
  question: string;
  answer: string[];
  note?: string;
  link?: {
    label: string;
    href: string;
  };
}

export const HELP_CATEGORIES: HelpCategoryItem[] = [
  {
    id: 'applications',
    title: 'Applications',
    description: 'Guidelines on drafting, verifying, and tracking scholarship and fellowship applications.',
    iconName: 'FileText',
    topics: [
      'How to apply',
      'Application status',
      'Editing an application',
      'Application submission',
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'File specifications, upload checklists, verification procedures, and rectification workflows.',
    iconName: 'FileCheck',
    topics: [
      'Required documents',
      'Uploading documents',
      'Document verification',
      'Fixing document deficiencies',
    ],
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    description: 'Income thresholds, community certification criteria, and academic qualification requirements.',
    iconName: 'ClipboardCheck',
    topics: [
      'Eligibility criteria',
      'Eligibility guidance',
      'Missing information',
      'Verification process',
    ],
  },
  {
    id: 'scholarships',
    title: 'Scholarships & Fellowships',
    description: 'Scheme catalogues, fellowship stipends, quotas, and MoTA selection milestones.',
    iconName: 'GraduationCap',
    topics: [
      'Finding schemes',
      'Scheme benefits',
      'Important dates',
      'Selection process',
    ],
  },
  {
    id: 'account',
    title: 'Account & Profile',
    description: 'Profile information updates, notification settings, and display preferences.',
    iconName: 'User',
    topics: [
      'Profile information',
      'Settings',
      'Notifications',
      'Account preferences',
    ],
  },
  {
    id: 'technical',
    title: 'Technical Help',
    description: 'Device compatibility, upload troubleshooting, and portal accessibility support.',
    iconName: 'LifeBuoy',
    topics: [
      'Login issues',
      'Upload problems',
      'Browser issues',
      'General technical support',
    ],
  },
];

export const POPULAR_TOPICS: PopularTopicItem[] = [
  {
    id: 'pop-how-to-apply',
    title: 'How do I apply for a scholarship?',
    category: 'Applications',
    badgeText: 'Application Guide',
    summary: 'Browse available schemes, check your eligibility, prepare the necessary certificates, and complete the multi-step online form.',
    details: [
      '1. Navigate to "All Schemes" or "Recommended Schemes" from your student navigation.',
      '2. Review the eligibility requirements, closing dates, and financial benefits for your selected scheme.',
      '3. Click "Apply Now" to launch the structured application wizard.',
      '4. Complete the personal, academic, community, and bank information sections.',
      '5. Upload the required supporting documents in PDF or JPEG format.',
      '6. Review all entered details carefully before final submission.',
    ],
    quickLink: {
      label: 'Explore Schemes',
      href: '/student/all-schemes',
    },
  },
  {
    id: 'pop-check-status',
    title: 'How can I check my application status?',
    category: 'Applications',
    badgeText: 'Tracking',
    summary: 'View real-time workflow milestones and current review stages from the My Applications section.',
    details: [
      '1. Open "My Applications" in your student menu.',
      '2. Locate your application by Scheme Name or Application Reference ID.',
      '3. The status indicator clearly displays whether your file is in Draft, Submitted, Under Institution Verification, Under State Verification, or Approved.',
      '4. Click on any application card to inspect the step-by-step timeline and recent activity audit log.',
    ],
    quickLink: {
      label: 'View My Applications',
      href: '/student/applications',
    },
  },
  {
    id: 'pop-documents-required',
    title: 'What documents are required?',
    category: 'Documents',
    badgeText: 'Checklist',
    summary: 'Core documents typically include ST Community Certificate, Income Certificate, Academic Marksheets, and Bank Passbook.',
    details: [
      'Scheduled Tribe (ST) Certificate issued by a competent revenue authority.',
      'Annual Family Income Certificate for the current financial year.',
      'Previous Academic Qualification Marksheets (Class 10, 12, Graduation, or Post-Graduation).',
      'Valid Admission Proof or Bona Fide Student Certificate from your registered educational institution.',
      'Copy of Bank Passbook or Cancelled Cheque showing your Name, Account Number, and IFSC code (Aadhaar-seeded account recommended).',
    ],
    quickLink: {
      label: 'Open Document Central',
      href: '/student/documents',
    },
  },
  {
    id: 'pop-doc-attention',
    title: 'What should I do if a document needs attention?',
    category: 'Documents',
    badgeText: 'Deficiency Action',
    summary: 'Access the Action Required workspace, review the verifier remark, and upload a corrected document.',
    details: [
      'When a verification officer flags an unreadable scan, name mismatch, or expired certificate, an alert is automatically generated.',
      'Go to "Action Required" from the sidebar menu to view flagged documents.',
      'Click "Review Document" to inspect the specific deficiency reason provided by the reviewing authority.',
      'Upload a clear, legible replacement scan and submit the update.',
      'Your updated document is immediately returned to the verification queue without losing your application place.',
    ],
    quickLink: {
      label: 'Check Action Required',
      href: '/student/action-required',
    },
  },
  {
    id: 'pop-correct-after-sub',
    title: 'Can I correct my application after submission?',
    category: 'Applications',
    badgeText: 'Modifications',
    summary: 'Submitted applications are locked for official review, but you can update specific fields if requested by the verifying officer.',
    details: [
      'Once submitted, application data is locked to preserve institutional audit integrity.',
      'If an officer finds an inadvertent discrepancy or missing attachment during verification, they will raise an official Action Required item.',
      'You can only modify the exact sections or documents requested by the verifying officer.',
      'For critical pre-verification corrections, you may file a support inquiry referencing your Application ID.',
    ],
  },
  {
    id: 'pop-doc-verification',
    title: 'How does document verification work?',
    category: 'Documents',
    badgeText: 'Workflow',
    summary: 'Multi-stage verification involves automated document matching assistance, followed by Nodal Institution and State Officer verification.',
    details: [
      'Stage 1: Automated cross-checks verify document format, basic OCR readability, and preliminary data consistency.',
      'Stage 2: Institution Nodal Officers verify student enrollment, fee structure, and physical records.',
      'Stage 3: State or Ministry Reviewers authenticate community quota eligibility and approve disbursement batches.',
    ],
  },
  {
    id: 'pop-official-comm',
    title: 'How will I receive official communication?',
    category: 'Account',
    badgeText: 'Notifications',
    summary: 'Official updates are posted directly to your in-portal Notifications inbox and sent via SMS/Email if enabled.',
    details: [
      'All official communications are published securely within the portal under the "Notifications" tab.',
      'Important alerts regarding action items, application status shifts, and disbursement notices will also be sent to your verified mobile number and email.',
      'Always verify notifications by logging in directly to the official portal.',
    ],
    quickLink: {
      label: 'View Notifications',
      href: '/student/notifications',
    },
  },
  {
    id: 'pop-after-submission',
    title: 'What happens after submission?',
    category: 'Applications',
    badgeText: 'Lifecycle',
    summary: 'Your application moves through institutional verification, state scrutiny, committee screening, and Direct Benefit Transfer (DBT) queuing.',
    details: [
      '1. Acknowledgement: You receive a unique Application ID and downloadable submission receipt.',
      '2. Institutional Scrutiny: Your registered college/university validates enrollment and academic credentials.',
      '3. Authority Review: MoTA / State Tribal Welfare Department conducts merit screening and quota allocation.',
      '4. Selection & Sanction: Approved applicants receive a formal Sanction Order.',
      '5. Fund Disbursement: Scholarship stipends and fee allowances are credited directly to your Aadhaar-linked bank account via PFMS/DBT.',
    ],
  },
];

export const FAQ_DATA: FAQItem[] = [
  // Applications
  {
    id: 'faq-app-1',
    categoryId: 'applications',
    categoryName: 'Applications',
    question: 'How do I start a new application?',
    answer: [
      'To start a new application, open the "All Schemes" page from the navigation bar.',
      'Filter the schemes by your educational level (e.g. Higher Secondary, Undergraduate, Postgraduate, Fellowship) and select the appropriate scheme.',
      'Click "Apply Now" to begin filling the online application form.',
    ],
    link: {
      label: 'View All Schemes',
      href: '/student/all-schemes',
    },
  },
  {
    id: 'faq-app-2',
    categoryId: 'applications',
    categoryName: 'Applications',
    question: 'Can I save an application and continue later?',
    answer: [
      'Yes. The portal automatically saves your progress at every stage of the application wizard.',
      'You can safely log out or return later. Your incomplete draft will be listed under "My Applications" marked with the "Draft" status badge.',
    ],
    link: {
      label: 'Check Drafts in My Applications',
      href: '/student/applications',
    },
  },
  {
    id: 'faq-app-3',
    categoryId: 'applications',
    categoryName: 'Applications',
    question: 'Can I edit my application before submission?',
    answer: [
      'Yes. While your application is in "Draft" state, you can edit any section freely—including personal info, academic details, and uploaded certificates.',
      'Before final submission, you will see a comprehensive Review & Declaration page where all details are displayed for your final confirmation.',
    ],
  },
  {
    id: 'faq-app-4',
    categoryId: 'applications',
    categoryName: 'Applications',
    question: 'Where can I see my application ID?',
    answer: [
      'Your Application Reference ID (e.g., NFST-2026-90412) is displayed on your Student Dashboard, on your My Applications list, and in your downloadable application summary sheet.',
      'Please keep this ID handy whenever reaching out for support or tracking status.',
    ],
  },

  // Documents
  {
    id: 'faq-doc-1',
    categoryId: 'documents',
    categoryName: 'Documents',
    question: 'Which documents do I need to upload?',
    answer: [
      'Standard requirements include: Valid ST Caste/Tribe Certificate, Family Income Certificate, Latest Academic Marksheet, Bonafide Student Certificate from College/University, and Bank Account Proof.',
      'Specific schemes (such as National Overseas Scholarship or NFST) may require research synopsis or GRE/IELTS scorecards.',
    ],
    link: {
      label: 'Go to Documents Central',
      href: '/student/documents',
    },
  },
  {
    id: 'faq-doc-2',
    categoryId: 'documents',
    categoryName: 'Documents',
    question: 'What file formats are supported?',
    answer: [
      'The portal supports PDF (.pdf), JPEG (.jpg, .jpeg), and PNG (.png) files.',
      'Files must be clear, unblurred, and under 5 MB in size per document.',
    ],
  },
  {
    id: 'faq-doc-3',
    categoryId: 'documents',
    categoryName: 'Documents',
    question: 'What happens if a document needs attention?',
    answer: [
      'If a document scan is illegible or has a minor mismatch, the verification officer marks it as "Needs Attention" rather than rejecting your application.',
      'An item will appear immediately in your "Action Required" workspace with the reviewer comment.',
      'You can upload a corrected scan directly to resolve the query.',
    ],
    link: {
      label: 'View Action Required',
      href: '/student/action-required',
    },
  },
  {
    id: 'faq-doc-4',
    categoryId: 'documents',
    categoryName: 'Documents',
    question: 'Can I replace an uploaded document?',
    answer: [
      'During the application draft stage, you can replace or remove any document at any time.',
      'After submission, document replacement is enabled only when a deficiency or correction request is raised by the verifying officer in the Action Required section.',
    ],
  },

  // Eligibility
  {
    id: 'faq-elig-1',
    categoryId: 'eligibility',
    categoryName: 'Eligibility',
    question: 'How is eligibility checked?',
    answer: [
      'Eligibility is checked by matching your profile information (category, domicile, family annual income, course of study, and prior academic percentage) against the statutory guidelines defined by the Ministry of Tribal Affairs for each scheme.',
    ],
    link: {
      label: 'View Recommended Schemes',
      href: '/student/recommended-schemes',
    },
  },
  {
    id: 'faq-elig-2',
    categoryId: 'eligibility',
    categoryName: 'Eligibility',
    question: 'What does "Review required" mean?',
    answer: [
      'A "Review required" indicator means our automated preliminary checker noticed a discrepancy or missing piece of information (such as an unverified income slab or unconfirmed university accreditation) that requires manual review by an authorized officer before final qualification is confirmed.',
    ],
  },
  {
    id: 'faq-elig-3',
    categoryId: 'eligibility',
    categoryName: 'Eligibility',
    question: 'Does the AI decide my eligibility?',
    answer: [
      'No. AI and rule-based assistance are used strictly as assistive tools to help identify potential scheme matches, detect missing documents, and highlight potential errors early.',
      'Official eligibility determinations and selection decisions are made exclusively by authorized government verification officers and selection committees.',
    ],
    note: 'Governance Notice: All automated checks are assistive only. Official decisions require human verification in accordance with MoTA guidelines.',
  },

  // Selection
  {
    id: 'faq-sel-1',
    categoryId: 'scholarships',
    categoryName: 'Scholarships & Fellowships',
    question: 'How does screening and selection work?',
    answer: [
      'Once institutional verification is complete, applications are screened by the Ministry selection committee according to merit quotas, category reservations, and scheme guidelines.',
      'Final merit lists and selection letters are published inside the student portal and on the MoTA official portal.',
    ],
  },
  {
    id: 'faq-sel-2',
    categoryId: 'scholarships',
    categoryName: 'Scholarships & Fellowships',
    question: 'When will the selection outcome be communicated?',
    answer: [
      'Selection outcomes are released according to the scheme calendar following verification cut-off dates.',
      'You will receive an in-portal notification and SMS alert as soon as the official sanction list is gazetted.',
    ],
  },
  {
    id: 'faq-sel-3',
    categoryId: 'scholarships',
    categoryName: 'Scholarships & Fellowships',
    question: 'Where can I see official updates?',
    answer: [
      'All official announcements, deadlines, and circulars appear in your Notifications center and the Ministry of Tribal Affairs portal announcements board.',
    ],
    link: {
      label: 'Open Notifications',
      href: '/student/notifications',
    },
  },

  // Account & Profile
  {
    id: 'faq-acc-1',
    categoryId: 'account',
    categoryName: 'Account & Profile',
    question: 'How can I update my profile?',
    answer: [
      'Navigate to "Profile" from the account menu or sidebar.',
      'You can update contact details, address, and bank details. Any changes to core personal identity or community certification will trigger a re-verification requirement for ongoing applications.',
    ],
    link: {
      label: 'Manage Profile',
      href: '/student/profile',
    },
  },
  {
    id: 'faq-acc-2',
    categoryId: 'account',
    categoryName: 'Account & Profile',
    question: 'How can I change notification preferences?',
    answer: [
      'Go to "Settings" from your account dropdown.',
      'Under the Notification Preferences section, toggle email, SMS, and in-app alert channels according to your preference.',
    ],
    link: {
      label: 'Go to Settings',
      href: '/student/settings',
    },
  },
  {
    id: 'faq-acc-3',
    categoryId: 'account',
    categoryName: 'Account & Profile',
    question: 'Where can I manage account accessibility and display settings?',
    answer: [
      'You can adjust language (English, Hindi, Marathi), font size (Default / Large), high contrast mode, and motion reduction directly from the "Settings" page.',
    ],
    link: {
      label: 'Open Display Settings',
      href: '/student/settings',
    },
  },

  // Technical Help
  {
    id: 'faq-tech-1',
    categoryId: 'technical',
    categoryName: 'Technical Help',
    question: 'What should I do if a document fails to upload?',
    answer: [
      '1. Verify that your file is in PDF, JPEG, or PNG format and less than 5 MB in size.',
      '2. Ensure your internet connection is stable.',
      '3. Try clearing your browser cache or switching to an updated modern browser (Chrome, Firefox, Edge, Safari).',
      '4. If the issue persists, submit a local technical support request below.',
    ],
  },
  {
    id: 'faq-tech-2',
    categoryId: 'technical',
    categoryName: 'Technical Help',
    question: 'How do I reset or update my portal preferences?',
    answer: [
      'Open the Settings page and click "Reset to Defaults" to restore the standard portal appearance and notification configuration.',
    ],
    link: {
      label: 'Go to Settings',
      href: '/student/settings',
    },
  },
  {
    id: 'faq-tech-3',
    categoryId: 'technical',
    categoryName: 'Technical Help',
    question: 'Which browsers are recommended for Shiksha Setu?',
    answer: [
      'Shiksha Setu is optimized for all modern web browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari on both mobile devices and desktop computers.',
    ],
  },
];