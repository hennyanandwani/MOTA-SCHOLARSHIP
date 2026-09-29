export type RecommendedScheme = {
  id: string;
  name: string;
  category: 'Fellowship' | 'Scholarship';
  status: 'Open' | 'Upcoming';
  match: 'High' | 'Good' | 'Review';
  deadline: string;
  description: string;
  factors: string[];
};

export const recommendedSchemes: RecommendedScheme[] = [
  {
    id: 'national-fellowship-st',
    name: 'National Fellowship for ST Students',
    category: 'Fellowship',
    status: 'Open',
    match: 'High',
    deadline: '30 Nov 2026',
    description:
      'Support for higher studies and research at recognized institutions for ST students.',
    factors: ['ST Category', 'Academic Level', 'Institution Type'],
  },
  {
    id: 'post-matric-st',
    name: 'Post Matric Scholarship for ST Students',
    category: 'Scholarship',
    status: 'Open',
    match: 'Good',
    deadline: '15 Dec 2026',
    description:
      'Financial assistance for eligible post-secondary study and related education expenses.',
    factors: ['ST Category', 'Academic Level', 'Income Criteria', 'Institution Type'],
  },
  {
    id: 'pre-matric-st',
    name: 'Pre-Matric Scholarship for ST Students',
    category: 'Scholarship',
    status: 'Upcoming',
    match: 'Review',
    deadline: '15 Jan 2027',
    description:
      'School-level scholarship support for students at the pre-matric stage.',
    factors: ['ST Category', 'Academic Level', 'Income Criteria'],
  },
];