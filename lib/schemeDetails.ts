import { schemes, type Scheme } from '@/lib/schemes';

export type SchemeDetailContent = {
  shortDescription: string;
  purpose: string;
  targetStudents: string;
  educationCoverage: string;
  supportSummary: string;
  benefits: { title: string; description: string; icon: 'tuition' | 'living' | 'books' | 'education' }[];
  criteria: { title: string; description: string; profileMatch: boolean }[];
  documents: { name: string; required: boolean }[];
  dates: { label: string; value: string }[];
  instructions: string[];
  faqs: { question: string; answer: string }[];
};

export type SchemeWithDetails = {
  scheme: Scheme;
  details: SchemeDetailContent;
};

const postMatricDetails: SchemeDetailContent = {
  shortDescription:
    'Financial assistance for eligible Scheduled Tribe students pursuing post-matriculation education.',
  purpose:
    'The scheme supports continued education after school by helping reduce eligible study-related costs for Scheduled Tribe students.',
  targetStudents:
    'Scheduled Tribe students enrolled in eligible post-matric courses at recognized institutions.',
  educationCoverage:
    'Post-secondary and higher education courses, subject to the notified course list and scheme rules.',
  supportSummary:
    'Support may include tuition assistance, maintenance support, and other eligible academic expenses.',
  benefits: [
    { title: 'Tuition assistance', description: 'Help toward eligible tuition fees as defined by scheme rules.', icon: 'tuition' },
    { title: 'Maintenance support', description: 'Support for eligible study and living expenses during the course.', icon: 'living' },
    { title: 'Academic allowances', description: 'Allowances may be available for approved academic requirements.', icon: 'books' },
    { title: 'Education expenses', description: 'Assistance for other expenses recognized by the scheme.', icon: 'education' },
  ],
  criteria: [
    { title: 'Category', description: 'Applicant must belong to the Scheduled Tribe category.', profileMatch: true },
    { title: 'Academic level', description: 'Applicant must be pursuing an eligible post-matric course.', profileMatch: true },
    { title: 'Institution', description: 'Applicant must be enrolled in a recognized institution.', profileMatch: true },
    { title: 'Income', description: 'Family income must meet the scheme’s configured limit.', profileMatch: true },
    { title: 'Academic requirement', description: 'Applicant must satisfy the applicable academic requirements.', profileMatch: false },
    { title: 'Residence and other conditions', description: 'Additional scheme-specific conditions may apply.', profileMatch: false },
  ],
  documents: [
    { name: 'ST Certificate', required: true },
    { name: 'Income Certificate', required: true },
    { name: 'Aadhaar or identity document', required: true },
    { name: 'Previous academic marksheet', required: true },
    { name: 'Admission or bonafide certificate', required: true },
    { name: 'Bank account details', required: true },
    { name: 'Passport-size photograph', required: true },
  ],
  dates: [
    { label: 'Applications open', value: '01 July 2026' },
    { label: 'Last date to apply', value: '15 December 2026' },
    { label: 'Verification period', value: 'December 2026 – January 2027' },
    { label: 'Expected decision', value: 'February 2027' },
  ],
  instructions: [
    'Keep your documents ready before starting the application.',
    'Ensure the information you enter matches your official documents.',
    'Review all details carefully before submission.',
    'Your application may require additional verification.',
    'You can correct deficiencies if the portal requests changes.',
  ],
  faqs: [
    { question: 'What documents do I need?', answer: 'The required document checklist is shown on this page. Additional documents may be requested based on your profile or course.' },
    { question: 'Can I edit my application after submission?', answer: 'Submitted applications may be locked for editing. Follow any correction window or instructions shown in the portal.' },
    { question: 'What happens if a document is rejected?', answer: 'The portal may ask you to provide a corrected document. Check your application status and notifications for instructions.' },
    { question: 'How can I track my application?', answer: 'Use My Applications in the Student Portal to review your current stage, updates, and any requested action.' },
    { question: 'Does profile matching guarantee eligibility?', answer: 'No. Profile matching is guidance only. Final eligibility is determined through the official verification and review process.' },
  ],
};

const schemeAliases: Record<string, string> = {
  'post-matric-st-scholarship': 'post-matric-st',
};

function createGeneralDetails(scheme: Scheme): SchemeDetailContent {
  return {
    shortDescription: scheme.description,
    purpose: scheme.description,
    targetStudents: `Scheduled Tribe students pursuing ${scheme.academicLevel.toLowerCase()} education in an eligible course.`,
    educationCoverage: `${scheme.academicLevel} courses at recognized institutions, subject to the notified course list and scheme rules.`,
    supportSummary: 'Support may include eligible education-related expenses as defined by the scheme rules.',
    benefits: postMatricDetails.benefits,
    criteria: [
      ...postMatricDetails.criteria.slice(0, 3),
      { ...postMatricDetails.criteria[3], description: 'Family income must meet the scheme’s configured limit.' },
      ...postMatricDetails.criteria.slice(4),
    ],
    documents: postMatricDetails.documents,
    dates: [
      { label: 'Applications open', value: 'See scheme notices' },
      { label: 'Last date to apply', value: scheme.deadline },
      { label: 'Verification period', value: 'To be announced' },
      { label: 'Expected decision', value: 'To be announced' },
    ],
    instructions: postMatricDetails.instructions,
    faqs: postMatricDetails.faqs,
  };
}

export function getSchemeWithDetails(schemeId: string): SchemeWithDetails | undefined {
  const resolvedId = schemeAliases[schemeId] ?? schemeId;
  const scheme = schemes.find((item) => item.id === resolvedId);

  if (!scheme) return undefined;

  return {
    scheme,
    details: scheme.id === 'post-matric-st' ? postMatricDetails : createGeneralDetails(scheme),
  };
}