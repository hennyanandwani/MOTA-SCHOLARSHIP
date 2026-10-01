export type PersonalInformation = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  category: string;
  stCertificateNumber: string;
  identityNumber: string;
  mobileNumber: string;
  emailAddress: string;
  address: string;
  villageTown: string;
  district: string;
  state: string;
  pinCode: string;
};

export type AcademicInformation = {
  academicLevel: string;
  course: string;
  specialization: string;
  institutionName: string;
  institutionType: string;
  universityBoard: string;
  currentYearSemester: string;
  admissionYear: string;
  academicSession: string;
  previousQualification: string;
  previousResult: string;
  enrollmentNumber: string;
  expectedGraduationYear: string;
};

export type FamilyInformation = {
  guardianName: string;
  motherName: string;
  annualIncome: string;
  incomeCertificateNumber: string;
  guardianOccupation: string;
  familyMembers: string;
  residentialStatus: string;
};

export type BankInformation = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  branchName: string;
};

export type ApplicationData = {
  personal: PersonalInformation;
  academic: AcademicInformation;
  family: FamilyInformation;
  bank: BankInformation;
};

export type ApplicationStep = 1 | 2 | 3 | 4;

export type ApplicationDeclarations = {
  informationIsTrue: boolean;
  verificationAcknowledged: boolean;
};

export type SavedApplicationDraft = {
  data: ApplicationData;
  currentStep: ApplicationStep;
  declarations: ApplicationDeclarations;
  savedAt: string;
};

export const demoApplicationData: ApplicationData = {
  personal: {
    firstName: 'Rahul',
    middleName: '',
    lastName: 'Kumar',
    dateOfBirth: '2005-08-12',
    gender: 'Male',
    category: 'Scheduled Tribe',
    stCertificateNumber: 'ST-GJ-DEMO-2026-001',
    identityNumber: 'XXXX XXXX 1234',
    mobileNumber: '90000 00000',
    emailAddress: 'rahul.kumar@example.invalid',
    address: '12 Sample Road',
    villageTown: 'Rajkot',
    district: 'Rajkot',
    state: 'Gujarat',
    pinCode: '360001',
  },
  academic: {
    academicLevel: 'Undergraduate',
    course: 'B.Sc. Computer Science',
    specialization: 'Computer Science',
    institutionName: 'Government College',
    institutionType: 'Government',
    universityBoard: 'Saurashtra University',
    currentYearSemester: 'Year 2, Semester 3',
    admissionYear: '2024',
    academicSession: '2026–27',
    previousQualification: 'Class 12',
    previousResult: '78.5%',
    enrollmentNumber: 'DEMO-2024-UG-001',
    expectedGraduationYear: '2027',
  },
  family: {
    guardianName: 'Ramesh Kumar',
    motherName: 'Sita Kumar',
    annualIncome: '180000',
    incomeCertificateNumber: 'INCOME-GJ-DEMO-2026-014',
    guardianOccupation: 'Agriculture',
    familyMembers: '5',
    residentialStatus: 'Rural',
  },
  bank: {
    accountHolderName: 'Rahul Kumar',
    bankName: 'Demo Cooperative Bank',
    accountNumber: '0000005678',
    confirmAccountNumber: '0000005678',
    ifscCode: 'DEMO0001234',
    branchName: 'Rajkot Main Branch',
  },
};

export const emptyDeclarations: ApplicationDeclarations = {
  informationIsTrue: false,
  verificationAcknowledged: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasStringFields(value: unknown, fields: readonly string[]): value is Record<string, string> {
  return isRecord(value) && fields.every((field) => typeof value[field] === 'string');
}

export function isSavedApplicationDraft(value: unknown): value is SavedApplicationDraft {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.declarations)) return false;

  const validPersonal = hasStringFields(value.data.personal, [
    'firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'category',
    'stCertificateNumber', 'identityNumber', 'mobileNumber', 'emailAddress', 'address',
    'villageTown', 'district', 'state', 'pinCode',
  ]);
  const validAcademic = hasStringFields(value.data.academic, [
    'academicLevel', 'course', 'specialization', 'institutionName', 'institutionType',
    'universityBoard', 'currentYearSemester', 'admissionYear', 'academicSession',
    'previousQualification', 'previousResult', 'enrollmentNumber', 'expectedGraduationYear',
  ]);
  const validFamily = hasStringFields(value.data.family, [
    'guardianName', 'motherName', 'annualIncome', 'incomeCertificateNumber',
    'guardianOccupation', 'familyMembers', 'residentialStatus',
  ]);
  const validBank = hasStringFields(value.data.bank, [
    'accountHolderName', 'bankName', 'accountNumber', 'confirmAccountNumber', 'ifscCode', 'branchName',
  ]);

  return (
    validPersonal &&
    validAcademic &&
    validFamily &&
    validBank &&
    (value.currentStep === 1 || value.currentStep === 2 || value.currentStep === 3 || value.currentStep === 4) &&
    typeof value.declarations.informationIsTrue === 'boolean' &&
    typeof value.declarations.verificationAcknowledged === 'boolean' &&
    typeof value.savedAt === 'string'
  );
}