'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { AcademicProfile } from './AcademicProfile';
import { BankInformation } from './BankInformation';
import { ContactInformation } from './ContactInformation';
import { PersonalInformation } from './PersonalInformation';
import { ProfileActivity } from './ProfileActivity';
import { ProfileCompletion } from './ProfileCompletion';
import { ProfileCompletionBreakdown } from './ProfileCompletionBreakdown';
import { ProfileHeader } from './ProfileHeader';
import { ProfileOverview } from './ProfileOverview';
import { ProfilePreferences } from './ProfilePreferences';
import { ProfileRequirements } from './ProfileRequirements';
import { STInformation } from './STInformation';
import { VerificationStatus } from './VerificationStatus';
import { initialStudentProfile, type StudentProfileData } from '@/lib/studentProfile';
import { useStudentSettings, useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

type EditableSectionKey = 'personal' | 'contact' | 'academic' | 'community' | 'bank';

export function ProfilePageClient() {
  const { currentSettings } = useStudentSettings();
  const t = useStudentTranslation();
  const [profile, setProfile] = useState<StudentProfileData>(initialStudentProfile);
  const [editingSection, setEditingSection] = useState<EditableSectionKey | null>(null);

  function saveSection<Key extends EditableSectionKey>(key: Key, values: StudentProfileData[Key]) {
    setProfile((current) => ({ ...current, [key]: values }));
    setEditingSection(null);
  }

  function editProfile() {
    setEditingSection('personal');
    requestAnimationFrame(() => {
      const section = document.getElementById('personal-information');
      section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      section?.querySelector<HTMLInputElement>('input')?.focus();
    });
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <ProfileHeader />

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <ProfileOverview
          fullName={profile.personal.fullName}
          studentId={profile.studentId}
          state={profile.contact.state}
          district={profile.contact.district}
          fpoName={profile.community.fpoName}
          maskSensitiveInformation={currentSettings.maskSensitiveInformation}
          onEditProfile={editProfile}
        />
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <ProfileCompletion />
          <VerificationStatus />
        </div>
      </div>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
        <PersonalInformation values={profile.personal} editing={editingSection === 'personal'} onBeginEdit={() => setEditingSection('personal')} onCancel={() => setEditingSection(null)} onSave={(values) => saveSection('personal', values)} />
        <ContactInformation values={profile.contact} editing={editingSection === 'contact'} onBeginEdit={() => setEditingSection('contact')} onCancel={() => setEditingSection(null)} onSave={(values) => saveSection('contact', values)} />
        <AcademicProfile values={profile.academic} editing={editingSection === 'academic'} onBeginEdit={() => setEditingSection('academic')} onCancel={() => setEditingSection(null)} onSave={(values) => saveSection('academic', values)} />
        <STInformation values={profile.community} editing={editingSection === 'community'} onBeginEdit={() => setEditingSection('community')} onCancel={() => setEditingSection(null)} onSave={(values) => saveSection('community', values)} />
        <BankInformation values={profile.bank} editing={editingSection === 'bank'} onBeginEdit={() => setEditingSection('bank')} onCancel={() => setEditingSection(null)} onSave={(values) => saveSection('bank', values)} />
      </div>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
        <ProfileRequirements />
        <ProfileCompletionBreakdown />
      </div>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
        <ProfilePreferences />
        <ProfileActivity />
      </div>

      <section aria-labelledby="profile-applications-heading" className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h2 id="profile-applications-heading" className="text-sm font-semibold text-[#172033]">{t('Your profile is used across your applications')}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#64748B]">{t('Information from your profile may be used to pre-fill applicable scholarship and fellowship applications. Scheme-specific requirements may still require additional information.')}</p>
        </div>
        <Link href="/student/applications" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2">{t('View My Applications')} <ArrowRight size={14} aria-hidden="true" /></Link>
      </section>

      <aside aria-labelledby="profile-guidance-heading" className="flex min-w-0 items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
        <Info size={17} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="profile-guidance-heading" className="text-sm font-semibold text-[#172033]">{t('Profile-based guidance')}</h2>
          <p className="mt-1 text-xs leading-5 text-[#475569]">{t('Your profile information may be used to provide scheme discovery and eligibility guidance. These suggestions are informational and do not determine final eligibility.')}</p>
        </div>
      </aside>
    </div>
  );
}