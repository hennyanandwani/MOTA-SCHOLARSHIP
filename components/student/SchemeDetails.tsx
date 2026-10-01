import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  BookText,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  Landmark,
  MapPin,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SchemeWithDetails } from '@/lib/schemeDetails';
import { SchemeSaveButton } from '@/components/student/SchemeSaveButton';

const benefitIcons: Record<'tuition' | 'living' | 'books' | 'education', LucideIcon> = {
  tuition: Banknote,
  living: Landmark,
  books: BookText,
  education: BookOpen,
};

const processSteps = [
  'Check Eligibility',
  'Complete Application',
  'Upload Documents',
  'Review & Submit',
  'Verification & Decision',
];

export function SchemeDetails({ data }: { data: SchemeWithDetails }) {
  const { scheme, details } = data;
  const eligibilityHref = `/student/schemes/${scheme.id}/eligibility`;
  const statusClass = scheme.status === 'Open'
    ? 'bg-emerald-50 text-[#16805B] ring-emerald-200'
    : scheme.status === 'Upcoming'
      ? 'bg-blue-50 text-[#2563A8] ring-blue-200'
      : 'bg-slate-100 text-slate-600 ring-slate-200';

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link href="/student/all-schemes" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">All Schemes</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page" className="font-medium text-[#334155]">Scheme Details</span>
      </nav>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <section className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2563A8]">{scheme.type}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {scheme.status}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#64748B]">
              <ShieldCheck size={14} aria-hidden="true" />Official scheme information
            </span>
          </div>

          <h1 className="mt-4 break-words text-2xl font-bold leading-8 text-[#172033] sm:text-3xl sm:leading-10">{scheme.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">{details.shortDescription}</p>

          <dl className="mt-6 grid min-w-0 gap-4 border-y border-[#EEF1F5] py-4 sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-[11px] text-[#64748B]">Academic Year</dt>
              <dd className="mt-1 text-sm font-semibold text-[#172033]">2026–27</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] text-[#64748B]">Application Status</dt>
              <dd className="mt-1 text-sm font-semibold text-[#172033]">{scheme.status}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] text-[#64748B]">Last Date</dt>
              <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#172033]">
                <CalendarDays size={15} className="text-[#2563A8]" aria-hidden="true" />{scheme.deadline}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link href={eligibilityHref} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2 sm:w-auto">
              Check Eligibility <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <SchemeSaveButton />
          </div>
        </section>

        <ProfileMatchCard eligibilityHref={eligibilityHref} />
      </div>

      <section aria-labelledby="about-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
        <SectionHeading id="about-heading" title="About this scheme" icon={FileText} />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <InfoBlock title="Purpose" description={details.purpose} Icon={Landmark} />
          <InfoBlock title="Who it supports" description={details.targetStudents} Icon={UserRoundCheck} />
          <InfoBlock title="Education covered" description={`${details.educationCoverage} ${details.supportSummary}`} Icon={GraduationCap} />
        </div>
      </section>

      <section aria-labelledby="benefits-heading">
        <SectionHeading id="benefits-heading" title="Benefits" icon={CheckCircle2} />
        <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {details.benefits.map((benefit) => {
            const Icon = benefitIcons[benefit.icon];
            return (
              <article key={benefit.title} className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Icon size={18} aria-hidden="true" /></span>
                <h3 className="mt-3 text-sm font-semibold text-[#172033]">{benefit.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#64748B]">{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="criteria-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
        <SectionHeading id="criteria-heading" title="Eligibility Criteria" icon={ShieldCheck} />
        <p className="mt-1 text-xs leading-5 text-[#64748B]">Profile indicators are preliminary guidance and are not an official eligibility decision.</p>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
          {details.criteria.map((criterion) => (
            <article key={criterion.title} className="flex min-w-0 items-start gap-3 rounded-lg border border-[#EEF1F5] bg-[#FCFDFE] p-3.5">
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${criterion.profileMatch ? 'bg-emerald-50 text-[#16805B]' : 'bg-amber-50 text-[#94600D]'}`}>
                {criterion.profileMatch ? <Check size={15} aria-hidden="true" /> : <CircleHelp size={15} aria-hidden="true" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#172033]">{criterion.title}</h3>
                  <span className={`text-[10px] font-semibold ${criterion.profileMatch ? 'text-[#16805B]' : 'text-[#94600D]'}`}>
                    {criterion.profileMatch ? 'Profile match' : 'Review required'}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#64748B]">{criterion.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <section aria-labelledby="documents-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
          <SectionHeading id="documents-heading" title="Required Documents" icon={FileCheck2} />
          <ul className="mt-4 divide-y divide-[#EEF1F5]">
            {details.documents.map((document) => (
              <li key={document.name} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex min-w-0 items-start gap-2.5 text-sm text-[#334155]">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#16805B]" aria-hidden="true" />
                  <span className="break-words">{document.name}</span>
                </span>
                <span className="shrink-0 rounded-full bg-[#F1F5F9] px-2 py-1 text-[10px] font-medium text-[#475569]">
                  {document.required ? 'Required' : 'If applicable'}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-[#EEF1F5] pt-3 text-[11px] leading-5 text-[#64748B]">
            Document requirements may vary depending on your profile and scheme configuration.
          </p>
        </section>

        <section aria-labelledby="dates-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <SectionHeading id="dates-heading" title="Important Dates" icon={CalendarDays} />
            <span className="rounded-full border border-[#DCE3EC] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-medium text-[#64748B]">Sample dates</span>
          </div>
          <ol className="mt-4 space-y-0">
            {details.dates.map((date, index) => (
              <li key={date.label} className="relative flex gap-3 pb-4 last:pb-0">
                <span className="relative flex w-4 shrink-0 justify-center">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#2563A8] bg-white" />
                  {index < details.dates.length - 1 && <span className="absolute bottom-0 top-4 w-px bg-[#DCE3EC]" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-xs text-[#64748B]">{date.label}</span>
                  <span className="text-xs font-semibold text-[#172033]">{date.value}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <section aria-labelledby="process-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
          <SectionHeading id="process-heading" title="Application Process" icon={Clock3} />
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {processSteps.map((step, index) => (
              <li key={step} className="flex min-w-0 items-start gap-3 lg:flex-col lg:gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#B8C9DC] bg-[#F8FAFC] text-xs font-bold text-[#173F7A]">{index + 1}</span>
                <span className="pt-1 text-xs font-medium leading-5 text-[#334155] lg:pt-0">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="before-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-[#F8FAFC] p-5 sm:p-6">
          <SectionHeading id="before-heading" title="Before you apply" icon={FileText} />
          <ul className="mt-4 space-y-3">
            {details.instructions.map((instruction) => (
              <li key={instruction} className="flex items-start gap-2.5 text-xs leading-5 text-[#475569]">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="faq-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
        <SectionHeading id="faq-heading" title="Frequently Asked Questions" icon={CircleHelp} />
        <div className="mt-3 divide-y divide-[#EEF1F5]">
          {details.faqs.map((faq) => (
            <details key={faq.question} className="group py-3 first:pt-1 last:pb-0">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <span className="text-lg leading-none text-[#2563A8] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="max-w-4xl pb-2 pr-8 text-xs leading-5 text-[#64748B]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#C9D8E8] bg-[#F1F6FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#172033]">Ready to check your eligibility?</h2>
          <p className="mt-1 text-sm leading-5 text-[#64748B]">Review the eligibility criteria before starting your application.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href={eligibilityHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2">
            Check Eligibility <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/student/all-schemes" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-4 text-sm font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2">
            <ArrowLeft size={15} aria-hidden="true" />Back to All Schemes
          </Link>
        </div>
      </section>

      <p className="border-t border-[#DCE3EC] pt-4 text-[11px] leading-5 text-[#64748B]">
        Scheme information and dates shown are illustrative sample data. Refer to official notices for current rules. Profile matching is preliminary guidance; final eligibility is determined through official verification.
      </p>
    </div>
  );
}

function ProfileMatchCard({ eligibilityHref }: { eligibilityHref: string }) {
  const indicators = ['Category requirement', 'Academic level', 'Income information', 'Institution information'];

  return (
    <section aria-labelledby="profile-match-heading" className="min-w-0 rounded-xl border border-[#CFE4D9] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#16805B]"><UserRoundCheck size={20} aria-hidden="true" /></span>
        <div>
          <h2 id="profile-match-heading" className="text-base font-semibold text-[#172033]">Profile Match</h2>
          <p className="mt-0.5 text-[11px] font-medium text-[#16805B]">Preliminary guidance</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold leading-5 text-[#172033]">Your profile appears to match the basic criteria.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {indicators.map((indicator) => (
          <li key={indicator} className="flex items-center gap-2 text-xs text-[#475569]">
            <CheckCircle2 size={15} className="shrink-0 text-[#16805B]" aria-hidden="true" />{indicator}
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-[#EEF1F5] pt-3 text-[11px] leading-5 text-[#64748B]">
        Final eligibility is determined through the official verification process.
      </p>
      <Link href={eligibilityHref} className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">
        Review eligibility <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </section>
  );
}

function SectionHeading({ id, title, icon: Icon }: { id: string; title: string; icon: LucideIcon }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Icon size={16} aria-hidden="true" /></span>
      <h2 id={id} className="text-base font-semibold text-[#172033]">{title}</h2>
    </div>
  );
}

function InfoBlock({ title, description, Icon }: { title: string; description: string; Icon: LucideIcon }) {
  return (
    <article className="min-w-0 rounded-lg border border-[#EEF1F5] bg-[#FCFDFE] p-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className="shrink-0 text-[#2563A8]" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-[#172033]">{title}</h3>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#64748B]">{description}</p>
    </article>
  );
}