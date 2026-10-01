import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Info,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  EligibilityCriterion,
  EligibilityCriterionStatus,
  EligibilityReviewData,
} from '@/lib/eligibilityReview';

const statusPresentation: Record<
  EligibilityCriterionStatus,
  { label: string; Icon: LucideIcon; badgeClass: string; iconClass: string }
> = {
  matched: {
    label: 'Matched',
    Icon: CheckCircle2,
    badgeClass: 'bg-emerald-50 text-[#126747] ring-emerald-200',
    iconClass: 'bg-emerald-50 text-[#16805B]',
  },
  review: {
    label: 'Review Required',
    Icon: AlertCircle,
    badgeClass: 'bg-amber-50 text-[#94600D] ring-amber-200',
    iconClass: 'bg-amber-50 text-[#B7791F]',
  },
  missing: {
    label: 'Information Needed',
    Icon: CircleHelp,
    badgeClass: 'bg-slate-100 text-slate-700 ring-slate-200',
    iconClass: 'bg-slate-100 text-slate-600',
  },
};

const workflowSteps = [
  { title: 'Eligibility Review', status: 'Current step' },
  { title: 'Application Form', status: 'Next' },
  { title: 'Document Upload', status: 'Upcoming' },
  { title: 'Review & Submit', status: 'Upcoming' },
];

const disclaimer =
  'This eligibility check is a preliminary guidance tool. It does not guarantee selection or financial assistance. Final eligibility and selection are subject to scheme rules, document verification, scrutiny, and authorized review.';

export function EligibilityReview({ data }: { data: EligibilityReviewData }) {
  const matchedCount = data.criteria.filter((criterion) => criterion.status === 'matched').length;
  const reviewCount = data.criteria.filter((criterion) => criterion.status === 'review').length;
  const missingCount = data.criteria.filter((criterion) => criterion.status === 'missing').length;
  const needsReview = reviewCount > 0 || missingCount > 0;
  const schemeDetailsHref = `/student/schemes/${data.scheme.id}`;
  const applicationHref = `${schemeDetailsHref}/apply`;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link href="/student/all-schemes" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">All Schemes</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link href={schemeDetailsHref} className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Scheme Details</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page" className="font-medium text-[#334155]">Eligibility Check</span>
      </nav>

      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-[#172033]">Eligibility Check</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">
            Review your profile against the eligibility criteria before starting your application.
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3.5 py-2.5 sm:max-w-[340px]">
          <p className="break-words text-xs font-semibold text-[#172033]">{data.scheme.name}</p>
          <p className="mt-1 text-[11px] text-[#64748B]">Academic Year: {data.academicYear}</p>
        </div>
      </header>

      <section aria-labelledby="preliminary-review-heading" className="min-w-0 rounded-xl border border-[#C9D8E8] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]">
              <ClipboardCheck size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2563A8]">Preliminary review</p>
              <h3 id="preliminary-review-heading" className="mt-1 text-lg font-bold text-[#172033]">Profile Match: Good Match</h3>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-[#64748B]">
                Most of the information in your profile matches the currently configured criteria.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-[#EEF1F5] pt-4 sm:grid-cols-3 sm:gap-4 lg:min-w-[420px] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <SummaryCount label="Criteria matched" value={matchedCount} tone="success" Icon={CheckCircle2} />
            <SummaryCount label="Review required" value={reviewCount} tone="warning" Icon={AlertCircle} />
            <SummaryCount label="Information needed" value={missingCount} tone="neutral" Icon={CircleHelp} />
          </div>
        </div>
        <p className="mt-5 flex items-start gap-2 border-t border-[#EEF1F5] pt-4 text-xs leading-5 text-[#64748B]">
          <Info size={15} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
          This assessment is guidance only. Final eligibility is determined through official verification and review.
        </p>
      </section>

      <section aria-labelledby="criteria-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
        <div>
          <h3 id="criteria-heading" className="text-base font-semibold text-[#172033]">Eligibility Criteria</h3>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">Compare the available profile information with each configured requirement.</p>
        </div>
        <div className="mt-4 divide-y divide-[#EEF1F5]">
          {data.criteria.map((criterion) => (
            <CriterionRow key={criterion.id} criterion={criterion} />
          ))}
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <section id="profile-information" aria-labelledby="profile-information-heading" className="min-w-0 scroll-mt-24 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><UserRound size={16} aria-hidden="true" /></span>
            <h3 id="profile-information-heading" className="text-base font-semibold text-[#172033]">Information Used for This Review</h3>
          </div>
          <p className="mt-1 text-xs text-[#64748B]">Demo profile information</p>
          <dl className="mt-4 grid min-w-0 grid-cols-1 gap-x-5 sm:grid-cols-2">
            {data.profileInformation.map((item) => (
              <div key={item.label} className="min-w-0 border-b border-[#EEF1F5] py-3 first:pt-0 sm:[&:nth-child(-n+2)]:pt-0">
                <dt className="text-[11px] text-[#64748B]">{item.label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-[#172033]">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#64748B]">
            <Info size={14} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
            Some information may be verified using official documents.
          </p>
        </section>

        {needsReview && (
          <section id="review-required" aria-labelledby="review-required-heading" className="min-w-0 scroll-mt-24 rounded-xl border border-[#E9D5A5] bg-[#FFFBEB] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[#94600D]"><AlertCircle size={18} aria-hidden="true" /></span>
              <div className="min-w-0">
                <h3 id="review-required-heading" className="text-base font-semibold text-[#573B0A]">Review Required</h3>
                <ul className="mt-3 space-y-3">
                  {data.criteria.filter((criterion) => criterion.status === 'review' || criterion.status === 'missing').map((criterion) => (
                    <li key={criterion.id}>
                      <p className="text-sm font-semibold text-[#172033]">{criterion.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#765719]">
                        We need additional academic information to complete the preliminary review.
                      </p>
                    </li>
                  ))}
                </ul>
                <Link href="#profile-information" className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#C9A34E] bg-white px-3.5 text-xs font-semibold text-[#684B10] transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94600D] focus-visible:ring-offset-2">
                  Review Profile Information <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <section aria-labelledby="workflow-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
          <h3 id="workflow-heading" className="text-base font-semibold text-[#172033]">What Happens Next</h3>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <li key={step.title} className="flex min-w-0 items-start gap-3 xl:flex-col xl:gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${index === 0 ? 'border-[#2563A8] bg-blue-50 text-[#173F7A] ring-4 ring-blue-50' : 'border-[#CBD5E1] bg-white text-[#64748B]'}`}>
                  {index === 0 ? <Check size={15} aria-hidden="true" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-xs font-semibold ${index === 0 ? 'text-[#173F7A]' : 'text-[#334155]'}`}>{step.title}</span>
                  <span className={`mt-1 block text-[10px] ${index === 0 ? 'text-[#2563A8]' : 'text-[#64748B]'}`}>{step.status}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="review-method-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-[#F8FAFC] p-5 sm:p-6">
          <h3 id="review-method-heading" className="text-base font-semibold text-[#172033]">How this review works</h3>
          <p className="mt-2 text-xs leading-5 text-[#475569]">
            The platform compares the information in your profile with the scheme’s configured eligibility rules. AI-assisted services may help identify missing or inconsistent information, but they do not make the final eligibility decision.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE3EC] bg-white px-3 py-1.5 text-[11px] font-medium text-[#334155]">
              <FileText size={13} className="text-[#2563A8]" aria-hidden="true" />Configured Rules
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE3EC] bg-white px-3 py-1.5 text-[11px] font-medium text-[#334155]">
              <UserRound size={13} className="text-[#16805B]" aria-hidden="true" />Human Verification
            </span>
          </div>
        </section>
      </div>

      <section aria-labelledby="before-continue-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
        <h3 id="before-continue-heading" className="text-base font-semibold text-[#172033]">Before You Continue</h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.beforeContinue.map((item) => (
            <li key={item} className="flex min-w-0 items-start gap-2.5 text-xs leading-5 text-[#475569]">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#16805B]" aria-hidden="true" />{item}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#C9D8E8] bg-[#F1F6FC] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-[#172033]">
            {needsReview ? 'Review your information before continuing.' : 'Ready to start your application?'}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-[#64748B]">
            {needsReview
              ? 'You can continue after reviewing the information used in this preliminary check.'
              : 'You can continue to the application form. Additional verification may be required later.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <Link
            href={needsReview ? '#review-required' : applicationHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2"
          >
            {needsReview ? 'Review Information' : 'Start Application'} <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href={schemeDetailsHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-4 text-sm font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2">
            <ArrowLeft size={15} aria-hidden="true" />Back to Scheme Details
          </Link>
        </div>
      </section>

      <p className="flex items-start gap-2 border-t border-[#DCE3EC] pt-4 text-[11px] leading-5 text-[#64748B]">
        <Info size={14} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
        <span><strong className="font-semibold text-[#475569]">Important:</strong> {disclaimer}</span>
      </p>
    </div>
  );
}

function SummaryCount({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'neutral';
  Icon: LucideIcon;
}) {
  const toneClass = {
    success: 'text-[#16805B]',
    warning: 'text-[#94600D]',
    neutral: 'text-[#64748B]',
  }[tone];

  return (
    <div className="flex items-center gap-2.5 sm:block">
      <Icon size={16} className={`shrink-0 ${toneClass}`} aria-hidden="true" />
      <p className="min-w-0 text-xs text-[#64748B] sm:mt-1">{label}</p>
      <p className={`ml-auto text-base font-bold sm:ml-0 sm:mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

function CriterionRow({ criterion }: { criterion: EligibilityCriterion }) {
  const presentation = statusPresentation[criterion.status];
  const Icon = presentation.Icon;

  return (
    <article className="flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${presentation.iconClass}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h4 className="break-words text-sm font-semibold text-[#172033]">{criterion.title}</h4>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">{criterion.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 pl-11 sm:pl-0">
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${presentation.badgeClass}`}>
          <Icon size={13} aria-hidden="true" />{presentation.label}
        </span>
        {criterion.status !== 'matched' && (
          <Link href="#profile-information" className="inline-flex min-h-8 items-center rounded-lg px-2 text-[11px] font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">
            View profile information
          </Link>
        )}
      </div>
    </article>
  );
}