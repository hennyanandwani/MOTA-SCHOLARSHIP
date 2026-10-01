export interface PersonalInformation extends Record<string, string> {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  emailAddress: string;
}

export interface ContactInformation extends Record<string, string> {
  address: string;
  villageOrTown: string;
  district: string;
  state: string;
  pinCode: string;
}

export interface AcademicProfile extends Record<string, string> {
  academicLevel: string;
  course: string;
  institutionName: string;
  universityOrBoard: string;
  academicYear: string;
  previousQualification: string;
  percentageOrCgpa: string;
}

export interface CommunityInformation extends Record<string, string> {
  certificateStatus: string;
  certificateNumber: string;
  issuingAuthority: string;
  fpoMembership: string;
  fpoName: string;
}

export interface BankInformation extends Record<string, string> {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  verificationStatus: string;
}

export interface StudentProfileData {
  studentId: string;
  personal: PersonalInformation;
  contact: ContactInformation;
  academic: AcademicProfile;
  community: CommunityInformation;
  bank: BankInformation;
}

export interface CommunicationPreferences {
  emailNotifications: boolean;
  applicationUpdates: boolean;
  importantDocumentAlerts: boolean;
}

export type ProfileLanguage = 'English' | 'Hindi' | 'Marathi';

export const initialStudentProfile: StudentProfileData = {
  studentId: 'ST-2026-10482',
  personal: {
    fullName: 'Aarav Bhil',
    dateOfBirth: '2005-03-14',
    gender: 'Male',
    mobileNumber: '+91 98765 43210',
    emailAddress: 'aarav.bhil@example.com',
  },
  contact: {
    address: '12 Seva Marg',
    villageOrTown: 'Demo Nagar',
    district: 'Demo District',
    state: 'Gujarat',
    pinCode: '360001',
  },
  academic: {
    academicLevel: 'Undergraduate',
    course: 'B.A. Tribal Studies',
    institutionName: 'Government Arts College',
    universityOrBoard: 'Saurashtra University',
    academicYear: '2026-27',
    previousQualification: 'Class 12 (Higher Secondary)',
    percentageOrCgpa: '78.4%',
  },
  community: {
    certificateStatus: 'Verified',
    certificateNumber: 'GJ-ST-2026-4821',
    issuingAuthority: 'District Tribal Development Office',
    fpoMembership: 'No membership added',
    fpoName: 'Not provided',
  },
  bank: {
    bankName: 'State Bank of India',
    accountHolderName: 'Aarav Bhil',
    accountNumber: '000000004821',
    ifscCode: 'SBIN0001234',
    verificationStatus: 'Provided (demo)',
  },
};

export const initialCommunicationPreferences: CommunicationPreferences = {
  emailNotifications: true,
  applicationUpdates: true,
  importantDocumentAlerts: true,
};