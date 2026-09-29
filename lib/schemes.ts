export type SchemeType = 'Scholarship' | 'Fellowship';
export type AcademicLevel =
  | 'Pre-Matric'
  | 'Post-Matric'
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Research';
export type SchemeStatus = 'Open' | 'Upcoming' | 'Closed';

export type Scheme = {
  id: string;
  name: string;
  type: SchemeType;
  academicLevel: AcademicLevel;
  status: SchemeStatus;
  deadline: string;
  deadlineDate: string;
  addedDate: string;
  description: string;
};

export const schemes: Scheme[] = [
  {
    id: 'national-fellowship-st',
    name: 'National Fellowship for ST Students',
    type: 'Fellowship',
    academicLevel: 'Research',
    status: 'Open',
    deadline: '30 Nov 2026',
    deadlineDate: '2026-11-30',
    addedDate: '2026-08-25',
    description: 'Fellowship support for research and higher studies at recognized institutions.',
  },
  {
    id: 'post-matric-st',
    name: 'Post Matric Scholarship for ST Students',
    type: 'Scholarship',
    academicLevel: 'Post-Matric',
    status: 'Open',
    deadline: '15 Dec 2026',
    deadlineDate: '2026-12-15',
    addedDate: '2026-09-05',
    description: 'Education assistance for post-secondary studies, subject to scheme criteria.',
  },
  {
    id: 'pre-matric-st',
    name: 'Pre-Matric Scholarship for ST Students',
    type: 'Scholarship',
    academicLevel: 'Pre-Matric',
    status: 'Upcoming',
    deadline: '15 Jan 2027',
    deadlineDate: '2027-01-15',
    addedDate: '2026-09-10',
    description: 'School-level support for students before the post-matric stage.',
  },
  {
    id: 'top-class-st',
    name: 'Top Class Education for ST Students',
    type: 'Scholarship',
    academicLevel: 'Undergraduate',
    status: 'Open',
    deadline: '31 Oct 2026',
    deadlineDate: '2026-10-31',
    addedDate: '2026-08-30',
    description: 'Education assistance for notified courses at eligible institutions.',
  },
  {
    id: 'national-overseas-st',
    name: 'National Overseas Scholarship for ST Students',
    type: 'Scholarship',
    academicLevel: 'Postgraduate',
    status: 'Open',
    deadline: '15 Nov 2026',
    deadlineDate: '2026-11-15',
    addedDate: '2026-09-12',
    description: 'Support for eligible students pursuing higher education outside India.',
  },
  {
    id: 'tribal-research-fellowship',
    name: 'Tribal Research Fellowship',
    type: 'Fellowship',
    academicLevel: 'Research',
    status: 'Upcoming',
    deadline: '31 Jan 2027',
    deadlineDate: '2027-01-31',
    addedDate: '2026-09-18',
    description: 'Research support for studies related to tribal communities and development.',
  },
  {
    id: 'vocational-support-st',
    name: 'Vocational Education Support for ST Students',
    type: 'Scholarship',
    academicLevel: 'Post-Matric',
    status: 'Open',
    deadline: '20 Dec 2026',
    deadlineDate: '2026-12-20',
    addedDate: '2026-08-19',
    description: 'Assistance for eligible technical and vocational education programmes.',
  },
  {
    id: 'higher-studies-assistance',
    name: 'Higher Studies Assistance for ST Students',
    type: 'Scholarship',
    academicLevel: 'Postgraduate',
    status: 'Closed',
    deadline: '30 Sep 2026',
    deadlineDate: '2026-09-30',
    addedDate: '2026-07-22',
    description: 'Support for postgraduate study through participating institutions.',
  },
  {
    id: 'professional-course-scholarship',
    name: 'Professional Course Scholarship for ST Students',
    type: 'Scholarship',
    academicLevel: 'Undergraduate',
    status: 'Open',
    deadline: '10 Dec 2026',
    deadlineDate: '2026-12-10',
    addedDate: '2026-09-20',
    description: 'Education assistance for students enrolled in eligible professional courses.',
  },
  {
    id: 'doctoral-tribal-studies',
    name: 'Doctoral Fellowship in Tribal Studies',
    type: 'Fellowship',
    academicLevel: 'Research',
    status: 'Closed',
    deadline: '01 Oct 2026',
    deadlineDate: '2026-10-01',
    addedDate: '2026-07-30',
    description: 'Fellowship support for doctoral research in relevant fields of study.',
  },
  {
    id: 'school-continuation-scholarship',
    name: 'School Continuation Scholarship for ST Students',
    type: 'Scholarship',
    academicLevel: 'Pre-Matric',
    status: 'Upcoming',
    deadline: '28 Feb 2027',
    deadlineDate: '2027-02-28',
    addedDate: '2026-09-22',
    description: 'Illustrative school-level scholarship listing for the student portal.',
  },
  {
    id: 'postdoctoral-research-support',
    name: 'Postdoctoral Research Support for ST Scholars',
    type: 'Fellowship',
    academicLevel: 'Research',
    status: 'Upcoming',
    deadline: '15 Mar 2027',
    deadlineDate: '2027-03-15',
    addedDate: '2026-09-25',
    description: 'Sample listing for postdoctoral research support at recognized institutions.',
  },
];