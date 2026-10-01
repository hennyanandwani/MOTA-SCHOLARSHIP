'use client';

import Link from 'next/link';
import { ArrowRight, CircleUserRound } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ActionRequired } from '@/components/student/ActionRequired';
import { ApplicationProgress } from '@/components/student/ApplicationProgress';
import { ApplicationsTable } from '@/components/student/ApplicationsTable';
import { DashboardStats } from '@/components/student/DashboardStats';
import { QuickActions } from '@/components/student/QuickActions';
import { RecommendedSchemes } from '@/components/student/RecommendedSchemes';
import { studentNavigation } from '@/lib/navigation';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export default function StudentDashboard() {
  const t = useStudentTranslation();
  return (
    <div className="min-h-screen">
      <Topbar
        title="Student Dashboard"
        subtitle="Scholarship and fellowship application overview"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main id="dashboard" className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <section className="flex flex-col justify-between gap-5 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:flex-row sm:items-center sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2563A8]">{t('Demo workspace · sample data')}</p>
              <h1 className="mt-2 text-2xl font-bold text-[#172033]">{t('Good morning, Student')}</h1>
              <p className="mt-1 text-sm text-[#64748B]">{t('Here’s an overview of your scholarship and fellowship applications.')}</p>
            </div>

            <div id="profile" className="w-full rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:max-w-[285px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CircleUserRound size={17} className="text-[#2563A8]" aria-hidden="true" />
                  <p className="text-xs font-semibold text-[#334155]">Profile completion</p>
                </div>
                <span className="text-sm font-bold text-[#173F7A]">72%</span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-[#E3EAF2]"
                role="progressbar"
                  aria-label={t('Profile completion')}
                aria-valuenow={72}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full w-[72%] rounded-full bg-[#2563A8]" />
              </div>
              <Link href="/student/profile" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2563A8] hover:underline">
                {t('Complete profile')}<ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <DashboardStats />

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
            <div className="min-w-0 space-y-5">
              <ActionRequired />
              <ApplicationsTable />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
              <ApplicationProgress />
              <QuickActions />
            </div>
          </div>

          <RecommendedSchemes />

          <footer className="flex flex-col gap-1 border-t border-[#DCE3EC] pt-4 text-[11px] text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
            <p>{t('Ministry of Tribal Affairs · Scholarship & Fellowship Management System')}</p>
            <p>{t('AI-assisted workflows · Human oversight')}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}