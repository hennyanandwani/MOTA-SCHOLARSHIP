'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  FileQuestion,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
} from 'lucide-react';

const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-4 text-sm font-semibold text-[#334155] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';

const quickLinks = [
  { label: 'Dashboard', href: '/student', Icon: LayoutDashboard },
  { label: 'My Applications', href: '/student/applications', Icon: FileText },
  { label: 'Documents', href: '/student/documents', Icon: FolderOpen },
  { label: 'Available Schemes', href: '/student/all-schemes', Icon: GraduationCap },
];

export default function NotFound() {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/student');
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-[#F6F8FB] text-[#172033]">
      <header className="border-b border-[#DCE3EC] bg-white">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Scholarship and Fellowship Management System home" className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#173F7A]">
              <Image src="/images/india-emblem.svg" alt="" width={20} height={32} className="brightness-0 invert" priority />
            </span>
            <span className="min-w-0">
              <span className="block break-words text-sm font-bold text-[#172033]">Scholarship &amp; Fellowship Management System</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">Ministry of Tribal Affairs</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-[680px]">
          <section aria-labelledby="not-found-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563A8]"><FileQuestion size={23} aria-hidden="true" /></span>
              <p className="mt-5 text-5xl font-bold leading-none text-[#173F7A] sm:text-6xl">404</p>
              <h1 id="not-found-heading" className="mt-3 text-xl font-bold text-[#172033] sm:text-2xl">Page not found</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#64748B]">The page you&apos;re looking for doesn&apos;t exist or may have been moved.</p>
              <div className="mt-6 grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
                <Link href="/student" className={`${primaryButton} w-full sm:w-auto`}><LayoutDashboard size={16} aria-hidden="true" />Go to Dashboard</Link>
                <button type="button" onClick={goBack} className={`${secondaryButton} w-full sm:w-auto`}><ArrowLeft size={15} aria-hidden="true" />Go Back</button>
              </div>
              <Link href="/student/all-schemes" className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#2563A8] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">View Available Schemes<ArrowRight size={13} aria-hidden="true" /></Link>
            </div>
          </section>

          <section aria-labelledby="quick-links-heading" className="mt-4 rounded-xl border border-[#DCE3EC] bg-white p-4 sm:p-5">
            <h2 id="quick-links-heading" className="text-sm font-semibold text-[#172033]">Looking for something?</h2>
            <p className="mt-1 text-xs leading-5 text-[#64748B]">Use the navigation menu to explore your dashboard, applications, documents and available schemes.</p>
            <nav aria-label="Quick links" className="mt-3 grid gap-2 sm:grid-cols-2">
              {quickLinks.map(({ label, href, Icon }) => (
                <Link key={href} href={href} className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg border border-[#EEF1F5] bg-[#FCFDFE] px-3 text-xs font-medium text-[#334155] transition hover:border-[#C9D8E8] hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">
                  <Icon size={15} className="shrink-0 text-[#2563A8]" aria-hidden="true" /><span className="min-w-0 break-words">{label}</span><ArrowRight size={13} className="ml-auto shrink-0 text-[#94A3B8]" aria-hidden="true" />
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#DCE3EC] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <p className="text-xs font-semibold text-[#172033]">Scholarship &amp; Fellowship Management System</p>
          <p className="text-[11px] text-slate-500">Digital platform for scholarship and fellowship management.</p>
        </div>
      </footer>
    </div>
  );
}