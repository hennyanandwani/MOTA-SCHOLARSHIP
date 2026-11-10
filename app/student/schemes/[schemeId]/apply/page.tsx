import { notFound, redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ApplicationWizard } from '@/components/student/application/ApplicationWizard';
import { studentNavigation } from '@/lib/navigation';
import { getSchemeWorkflowInfo } from '@/lib/persistedScholarshipScheme';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { createApplicationProfilePrefill } from '@/lib/applicationDraft';

export default async function ScholarshipApplicationPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;
  const user = await getCurrentAppUser();
  if (!user || !user.student || user.role !== 'STUDENT') redirect('/login');

  const scheme = await getSchemeWorkflowInfo(schemeId);

  if (!scheme) notFound();
  const initialData = createApplicationProfilePrefill({
    autoFillEnabled: user.student.autoFillEnabled,
    email: user.email,
    firstName: user.student.firstName,
    middleName: user.student.middleName,
    lastName: user.student.lastName,
    dateOfBirth: user.student.dateOfBirth?.toISOString().slice(0, 10),
    gender: user.student.gender,
    category: user.student.category,
    stCertificateNumber: user.student.stCertificateNumber,
    mobileNumber: user.student.mobileNumber,
    address: user.student.address,
    villageTown: user.student.villageTown,
    district: user.student.district,
    state: user.student.state,
    pinCode: user.student.pinCode,
    academicLevel: user.student.academicLevel,
    courseName: user.student.courseName,
    specialization: user.student.specialization,
    instituteName: user.student.instituteName,
    institutionType: user.student.institutionType,
    universityBoard: user.student.universityBoard,
    currentYearSemester: user.student.currentYearSemester,
    admissionYear: user.student.admissionYear,
    academicSession: user.student.academicSession,
    previousQualification: user.student.previousQualification,
    previousResult: user.student.previousResult,
    enrollmentNumber: user.student.enrollmentNumber,
    expectedGraduationYear: user.student.expectedGraduationYear,
    guardianName: user.student.guardianName,
    motherName: user.student.motherName,
    familyAnnualIncome: user.student.familyAnnualIncome,
    incomeCertificateNumber: user.student.incomeCertificateNumber,
    guardianOccupation: user.student.guardianOccupation,
    familyMembers: user.student.familyMembers,
    residentialStatus: user.student.residentialStatus,
    accountHolderName: user.student.accountHolderName,
    bankName: user.student.bankName,
    accountNumber: user.student.accountNumber,
    ifscCode: user.student.ifscCode,
    branchName: user.student.branchName,
  });

  return (
    <div className="min-h-screen">
      <Topbar
        title="Scholarship Application"
        subtitle="Complete your scheme application in a few steps"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <ApplicationWizard scheme={scheme} initialData={initialData} />
      </main>
    </div>
  );
}