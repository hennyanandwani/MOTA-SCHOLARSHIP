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
  eligibilityNotGuaranteed: boolean;
  termsAccepted: boolean;
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

export function createEmptyApplicationData(): ApplicationData {
  return {
    personal: {
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      category: '',
      stCertificateNumber: '',
      identityNumber: '',
      mobileNumber: '',
      emailAddress: '',
      address: '',
      villageTown: '',
      district: '',
      state: '',
      pinCode: '',
    },
    academic: {
      academicLevel: '',
      course: '',
      specialization: '',
      institutionName: '',
      institutionType: '',
      universityBoard: '',
      currentYearSemester: '',
      admissionYear: '',
      academicSession: '',
      previousQualification: '',
      previousResult: '',
      enrollmentNumber: '',
      expectedGraduationYear: '',
    },
    family: {
      guardianName: '',
      motherName: '',
      annualIncome: '',
      incomeCertificateNumber: '',
      guardianOccupation: '',
      familyMembers: '',
      residentialStatus: '',
    },
    bank: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      branchName: '',
    },
  };
}

export function createApplicationProfilePrefill(profile: {
  autoFillEnabled: boolean;
  email: string;
  firstName?: unknown;
  middleName?: unknown;
  lastName?: unknown;
  dateOfBirth?: unknown;
  gender?: unknown;
  category?: unknown;
  stCertificateNumber?: unknown;
  mobileNumber?: unknown;
  address?: unknown;
  villageTown?: unknown;
  district?: unknown;
  state?: unknown;
  pinCode?: unknown;
  academicLevel?: unknown;
  courseName?: unknown;
  specialization?: unknown;
  instituteName?: unknown;
  institutionType?: unknown;
  universityBoard?: unknown;
  currentYearSemester?: unknown;
  admissionYear?: unknown;
  academicSession?: unknown;
  previousQualification?: unknown;
  previousResult?: unknown;
  enrollmentNumber?: unknown;
  expectedGraduationYear?: unknown;
  guardianName?: unknown;
  motherName?: unknown;
  familyAnnualIncome?: unknown;
  incomeCertificateNumber?: unknown;
  guardianOccupation?: unknown;
  familyMembers?: unknown;
  residentialStatus?: unknown;
  accountHolderName?: unknown;
  bankName?: unknown;
  accountNumber?: unknown;
  ifscCode?: unknown;
  branchName?: unknown;
}): ApplicationData {
  const data = createEmptyApplicationData();
  if (!profile.autoFillEnabled) return data;

  data.personal.firstName = profileValue(profile.firstName);
  data.personal.middleName = profileValue(profile.middleName);
  data.personal.lastName = profileValue(profile.lastName);
  data.personal.dateOfBirth = profileValue(profile.dateOfBirth);
  data.personal.gender = profileValue(profile.gender);
  data.personal.category = profileValue(profile.category);
  data.personal.stCertificateNumber = profileValue(profile.stCertificateNumber);
  data.personal.mobileNumber = profileValue(profile.mobileNumber);
  data.personal.emailAddress = profile.email;
  data.personal.address = profileValue(profile.address);
  data.personal.villageTown = profileValue(profile.villageTown);
  data.personal.district = profileValue(profile.district);
  data.personal.state = profileValue(profile.state);
  data.personal.pinCode = profileValue(profile.pinCode);
  data.academic.academicLevel = profileValue(profile.academicLevel);
  data.academic.course = profileValue(profile.courseName);
  data.academic.specialization = profileValue(profile.specialization);
  data.academic.institutionName = profileValue(profile.instituteName);
  data.academic.institutionType = profileValue(profile.institutionType);
  data.academic.universityBoard = profileValue(profile.universityBoard);
  data.academic.currentYearSemester = profileValue(profile.currentYearSemester);
  data.academic.admissionYear = profileValue(profile.admissionYear);
  data.academic.academicSession = profileValue(profile.academicSession);
  data.academic.previousQualification = profileValue(profile.previousQualification);
  data.academic.previousResult = profileValue(profile.previousResult);
  data.academic.enrollmentNumber = profileValue(profile.enrollmentNumber);
  data.academic.expectedGraduationYear = profileValue(profile.expectedGraduationYear);
  data.family.guardianName = profileValue(profile.guardianName);
  data.family.motherName = profileValue(profile.motherName);
  data.family.annualIncome = profileValue(profile.familyAnnualIncome);
  data.family.incomeCertificateNumber = profileValue(profile.incomeCertificateNumber);
  data.family.guardianOccupation = profileValue(profile.guardianOccupation);
  data.family.familyMembers = profileValue(profile.familyMembers);
  data.family.residentialStatus = profileValue(profile.residentialStatus);
  data.bank.accountHolderName = profileValue(profile.accountHolderName);
  data.bank.bankName = profileValue(profile.bankName);
  data.bank.accountNumber = profileValue(profile.accountNumber);
  data.bank.ifscCode = profileValue(profile.ifscCode);
  data.bank.branchName = profileValue(profile.branchName);

  return data;
}

function profileValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return value.toString();
  }
  return "";
}

export const emptyDeclarations: ApplicationDeclarations = {
  informationIsTrue: false,
  verificationAcknowledged: false,
  eligibilityNotGuaranteed: false,
  termsAccepted: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasStringFields(value: unknown, fields: readonly string[]): value is Record<string, string> {
  return isRecord(value) && fields.every((field) => typeof value[field] === 'string');
}

export function restoreApplicationData(value: unknown): ApplicationData | null {
  if (!isRecord(value) || !isRecord(value.bank) || typeof value.bank.accountNumber !== 'string') {
    return null;
  }

  const bank = value.bank;
  const restored = {
    ...value,
    bank: {
      ...bank,
      confirmAccountNumber:
        typeof bank.confirmAccountNumber === 'string'
          ? bank.confirmAccountNumber
          : bank.accountNumber,
    },
  };

  return isApplicationData(restored) ? restored : null;
}

export function isApplicationData(value: unknown): value is ApplicationData {
  if (!isRecord(value)) return false;

  const validPersonal = hasStringFields(value.personal, [
    'firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'category',
    'stCertificateNumber', 'identityNumber', 'mobileNumber', 'emailAddress', 'address',
    'villageTown', 'district', 'state', 'pinCode',
  ]);
  const validAcademic = hasStringFields(value.academic, [
    'academicLevel', 'course', 'specialization', 'institutionName', 'institutionType',
    'universityBoard', 'currentYearSemester', 'admissionYear', 'academicSession',
    'previousQualification', 'previousResult', 'enrollmentNumber', 'expectedGraduationYear',
  ]);
  const validFamily = hasStringFields(value.family, [
    'guardianName', 'motherName', 'annualIncome', 'incomeCertificateNumber',
    'guardianOccupation', 'familyMembers', 'residentialStatus',
  ]);
  const validBank = hasStringFields(value.bank, [
    'accountHolderName', 'bankName', 'accountNumber', 'confirmAccountNumber', 'ifscCode', 'branchName',
  ]);

  return validPersonal && validAcademic && validFamily && validBank;
}

export function getApplicationSubmissionErrors(value: unknown): string[] {
  const data = restoreApplicationData(value);
  if (!data) return ['The saved application data is incomplete or invalid.'];

  const requiredFields: { value: string; label: string }[] = [
    { value: data.personal.firstName, label: 'First name' },
    { value: data.personal.lastName, label: 'Last name' },
    { value: data.personal.dateOfBirth, label: 'Date of birth' },
    { value: data.personal.gender, label: 'Gender' },
    { value: data.personal.category, label: 'Category' },
    { value: data.personal.stCertificateNumber, label: 'ST certificate number' },
    { value: data.personal.identityNumber, label: 'Identity number' },
    { value: data.personal.mobileNumber, label: 'Mobile number' },
    { value: data.personal.emailAddress, label: 'Email address' },
    { value: data.personal.address, label: 'Address' },
    { value: data.personal.villageTown, label: 'Village or town' },
    { value: data.personal.district, label: 'District' },
    { value: data.personal.state, label: 'State' },
    { value: data.personal.pinCode, label: 'PIN code' },
    { value: data.academic.academicLevel, label: 'Academic level' },
    { value: data.academic.course, label: 'Course or program' },
    { value: data.academic.institutionName, label: 'Institution name' },
    { value: data.academic.institutionType, label: 'Institution type' },
    { value: data.academic.universityBoard, label: 'University or board' },
    { value: data.academic.currentYearSemester, label: 'Current year or semester' },
    { value: data.academic.admissionYear, label: 'Admission year' },
    { value: data.academic.academicSession, label: 'Academic session' },
    { value: data.academic.previousQualification, label: 'Previous qualification' },
    { value: data.academic.previousResult, label: 'Previous result' },
    { value: data.academic.enrollmentNumber, label: 'Enrollment number' },
    { value: data.academic.expectedGraduationYear, label: 'Expected graduation year' },
    { value: data.family.guardianName, label: 'Parent or guardian name' },
    { value: data.family.annualIncome, label: 'Annual family income' },
    { value: data.family.incomeCertificateNumber, label: 'Income certificate number' },
    { value: data.family.familyMembers, label: 'Number of family members' },
    { value: data.bank.accountHolderName, label: 'Account holder name' },
    { value: data.bank.bankName, label: 'Bank name' },
    { value: data.bank.accountNumber, label: 'Account number' },
    { value: data.bank.ifscCode, label: 'IFSC code' },
    { value: data.bank.branchName, label: 'Branch name' },
  ];
  const errors = requiredFields
    .filter(({ value }) => !value.trim())
    .map(({ label }) => `${label} is required.`);

  if (data.personal.emailAddress.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal.emailAddress.trim())) {
    errors.push('Enter a valid email address.');
  }

  const familyMembers = Number(data.family.familyMembers);
  if (!Number.isInteger(familyMembers) || familyMembers < 1) {
    errors.push('Number of family members must be a whole number of at least one.');
  }

  const annualIncome = Number(data.family.annualIncome);
  if (!Number.isFinite(annualIncome) || annualIncome < 0) {
    errors.push('Annual family income must be a non-negative number.');
  }

  return errors;
}

export function getApplicationStepValidationErrors(
  value: unknown,
  throughStep: 1 | 2 | 3,
): string[] {
  const data = restoreApplicationData(value);
  if (!data) return ["The application form data is incomplete or invalid."];

  const requiredByStep: Record<
    1 | 2 | 3,
    { value: string; label: string }[]
  > = {
    1: [
      { value: data.personal.firstName, label: "First name" },
      { value: data.personal.lastName, label: "Last name" },
      { value: data.personal.dateOfBirth, label: "Date of birth" },
      { value: data.personal.gender, label: "Gender" },
      { value: data.personal.category, label: "Category" },
      { value: data.personal.stCertificateNumber, label: "ST certificate number" },
      { value: data.personal.identityNumber, label: "Identity number" },
      { value: data.personal.mobileNumber, label: "Mobile number" },
      { value: data.personal.emailAddress, label: "Email address" },
      { value: data.personal.address, label: "Address" },
      { value: data.personal.villageTown, label: "Village or town" },
      { value: data.personal.district, label: "District" },
      { value: data.personal.state, label: "State" },
      { value: data.personal.pinCode, label: "PIN code" },
    ],
    2: [
      { value: data.academic.academicLevel, label: "Academic level" },
      { value: data.academic.course, label: "Course or program" },
      { value: data.academic.institutionName, label: "Institution name" },
      { value: data.academic.institutionType, label: "Institution type" },
      { value: data.academic.universityBoard, label: "University or board" },
      { value: data.academic.currentYearSemester, label: "Current year or semester" },
      { value: data.academic.admissionYear, label: "Admission year" },
      { value: data.academic.academicSession, label: "Academic session" },
      { value: data.academic.previousQualification, label: "Previous qualification" },
      { value: data.academic.previousResult, label: "Previous result" },
      { value: data.academic.enrollmentNumber, label: "Enrollment number" },
      { value: data.academic.expectedGraduationYear, label: "Expected graduation year" },
    ],
    3: [
      { value: data.family.guardianName, label: "Parent or guardian name" },
      { value: data.family.annualIncome, label: "Annual family income" },
      { value: data.family.incomeCertificateNumber, label: "Income certificate number" },
      { value: data.family.familyMembers, label: "Number of family members" },
      { value: data.bank.accountHolderName, label: "Account holder name" },
      { value: data.bank.bankName, label: "Bank name" },
      { value: data.bank.accountNumber, label: "Account number" },
      { value: data.bank.ifscCode, label: "IFSC code" },
      { value: data.bank.branchName, label: "Branch name" },
    ],
  };

  const errors = [1, 2, 3]
    .slice(0, throughStep)
    .flatMap((step) =>
      requiredByStep[step as 1 | 2 | 3]
        .filter(({ value }) => !value.trim())
        .map(({ label }) => `${label} is required.`),
    );

  if (
    throughStep >= 1 &&
    data.personal.emailAddress.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal.emailAddress.trim())
  ) {
    errors.push("Enter a valid email address.");
  }

  if (throughStep >= 3) {
    const familyMembers = Number(data.family.familyMembers);
    if (!Number.isInteger(familyMembers) || familyMembers < 1) {
      errors.push("Number of family members must be a whole number of at least one.");
    }

    const annualIncome = Number(data.family.annualIncome);
    if (!Number.isFinite(annualIncome) || annualIncome < 0) {
      errors.push("Annual family income must be a non-negative number.");
    }
  }

  return errors;
}

export function isSavedApplicationDraft(value: unknown): value is SavedApplicationDraft {
  if (!isRecord(value) || !isRecord(value.declarations)) return false;

  return (
    isApplicationData(value.data) &&
    (value.currentStep === 1 || value.currentStep === 2 || value.currentStep === 3 || value.currentStep === 4) &&
    typeof value.declarations.informationIsTrue === 'boolean' &&
    typeof value.declarations.verificationAcknowledged === 'boolean' &&
    typeof value.savedAt === 'string'
  );
}