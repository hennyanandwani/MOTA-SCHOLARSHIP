import { getSchemeWithDetails } from '@/lib/schemeDetails';
import type { Scheme } from '@/lib/schemes';

export type EligibilityCriterionStatus = 'matched' | 'review' | 'missing';

export type EligibilityCriterion = {
  id: string;
  title: string;
  status: EligibilityCriterionStatus;
  description: string;
};

export type EligibilityReviewData = {
  scheme: Scheme;
  academicYear: string;
  criteria: EligibilityCriterion[];
  profileInformation: { label: string; value: string }[];
  beforeContinue: string[];
};

const demoCriteria: EligibilityCriterion[] = [
  {
    id: 'category',
    title: 'Scheduled Tribe Category',
    status: 'matched',
    description: 'Your profile indicates the required category.',
  },
  {
    id: 'academic-level',
    title: 'Academic Level',
    status: 'matched',
    description: 'Your current academic level matches the scheme’s configured requirement.',
  },
  {
    id: 'institution',
    title: 'Institution',
    status: 'matched',
    description: 'Your institution information satisfies the currently configured requirement.',
  },
  {
    id: 'family-income',
    title: 'Family Income',
    status: 'matched',
    description: 'Your recorded income information is within the configured scheme criteria.',
  },
  {
    id: 'academic-requirement',
    title: 'Academic Requirement',
    status: 'matched',
    description: 'Your current academic information appears to meet the configured requirement, subject to verification.',
  },
];

const demoProfileInformation = [
  { label: 'Category', value: 'Scheduled Tribe' },
  { label: 'Academic Level', value: 'Undergraduate' },
  { label: 'Course', value: 'B.Sc. Computer Science' },
  { label: 'Institution', value: 'Government College' },
  { label: 'Family Income', value: '₹1,80,000 / year' },
  { label: 'State', value: 'Gujarat' },
  { label: 'Academic Year', value: '2026–27' },
];

const beforeContinue = [
  'Keep your ST certificate ready.',
  'Keep your income certificate ready.',
  'Keep academic documents ready.',
  'Ensure your profile information is accurate.',
  'Make sure your bank details are available.',
];

export function getEligibilityReview(schemeId: string): EligibilityReviewData | undefined {
  const schemeData = getSchemeWithDetails(schemeId);

  if (!schemeData) return undefined;

  return {
    scheme: schemeData.scheme,
    academicYear: '2026–27',
    criteria: demoCriteria,
    profileInformation: demoProfileInformation,
    beforeContinue,
  };
}