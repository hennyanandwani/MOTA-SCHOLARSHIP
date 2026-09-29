import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Search,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Clock3,
  Users,
  ChevronRight,
} from 'lucide-react';

const capabilities = [
  {
    icon: Search,
    title: 'Scheme discovery',
    description:
      'Find scholarship and fellowship opportunities that may fit your academic profile and circumstances.',
  },
  {
    icon: FileCheck2,
    title: 'AI-assisted verification',
    description:
      'OCR and intelligent checks help identify missing, inconsistent or unclear information before review.',
  },
  {
    icon: BarChart3,
    title: 'Transparent tracking',
    description:
      'Follow every important application stage, pending action and official update from one dashboard.',
  },
];

const journey = [
  'Discover',
  'Check eligibility',
  'Apply',
  'Verify documents',
  'Track application',
];

const highlights = [
  'One account for multiple schemes',
  'Configurable scheme workflows',
  'AI-assisted document checks',
  'Correction and resubmission support',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#172033]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#DCE3EC] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173F7A] text-sm font-bold text-white">
              <Image
                src="/images/india-emblem.svg"
                alt="Government of India emblem"
                width={20}
                height={32}
                className="brightness-0 invert"
              />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-[#172033]">
                Scholarship Portal
              </p>
              <p className="text-[11px] text-slate-500">
                Ministry of Tribal Affairs
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#schemes"
              className="text-sm font-medium text-slate-600 transition hover:text-[#173F7A]"
            >
              Schemes
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-[#173F7A]"
            >
              How it works
            </a>

            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-[#173F7A]"
            >
              Features
            </a>

            <a
              href="#faq"
              className="text-sm font-medium text-slate-600 transition hover:text-[#173F7A]"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/student"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-[#173F7A] transition hover:bg-blue-50 sm:block"
            >
              Student Login
            </Link>

            <Link
              href="/student"
              className="rounded-lg bg-[#173F7A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123362]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="overflow-hidden border-b border-[#DCE3EC] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          {/* Hero Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-[#173F7A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563A8]" />
              Ministry of Tribal Affairs · Smart Education
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-bold tracking-[-0.03em] text-[#172033] sm:text-5xl lg:text-[58px] lg:leading-[1.08]">
              One secure platform for{' '}
              <span className="text-[#173F7A]">
                scholarships & fellowships.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              A unified digital experience for Scheduled Tribe students and
              Ministry officials — from scheme discovery and application to
              AI-assisted verification, review and post-selection management.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/student"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#173F7A] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#123362]"
              >
                Explore Student Portal
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-[#DCE3EC] bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-slate-50"
              >
                Admin Portal
                <ChevronRight size={16} />
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
              {[
                'Secure access',
                'Configurable workflows',
                'AI-assisted checks',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600"
                >
                  <CheckCircle2 size={15} className="text-[#16805B]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="relative">
            <div className="absolute -inset-8 rounded-[40px] bg-blue-100/40 blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-[#DCE3EC] bg-[#F6F8FB] shadow-2xl shadow-slate-900/10">
              {/* Fake browser bar */}
              <div className="flex items-center justify-between border-b border-[#DCE3EC] bg-white px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                </div>

                <span className="text-[11px] font-medium text-slate-400">
                  Student Dashboard
                </span>

                <div className="w-12" />
              </div>

              <div className="p-5 sm:p-6">
                {/* Dashboard heading */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Welcome back
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-[#172033]">
                      Student Dashboard
                    </h3>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-[#173F7A]">
                    ST
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <DashboardStat
                    label="Applications"
                    value="03"
                  />
                  <DashboardStat
                    label="Under review"
                    value="01"
                  />
                  <DashboardStat
                    label="Action required"
                    value="02"
                  />
                </div>

                {/* Action card */}
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#B7791F]">
                      <Clock3 size={16} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#172033]">
                        Action required
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-600">
                        One document needs correction before your application
                        can proceed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Application */}
                <div className="mt-4 rounded-2xl border border-[#DCE3EC] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Current application
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#172033]">
                        Scholarship Application
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#2563A8]">
                      Under Review
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Submitted</span>
                      <span>Verification</span>
                      <span>Selection</span>
                    </div>

                    <div className="relative mt-2 h-1.5 rounded-full bg-slate-100">
                      <div className="absolute left-0 top-0 h-1.5 w-[58%] rounded-full bg-[#2563A8]" />
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-[#2563A8]" />
                    <span className="text-xs font-bold text-[#173F7A]">
                      Profile-based guidance
                    </span>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
                    3 schemes may fit your profile. Review eligibility criteria
                    before applying.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / highlights */}
      <section className="border-b border-[#DCE3EC] bg-[#F6F8FB]">
        <div className="mx-auto max-w-7xl px-6 py-7 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm font-medium text-slate-600"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                  <CheckCircle2 size={16} className="text-[#16805B]" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Platform capabilities"
            title="Everything important, in one place."
            description="The platform connects students, scheme workflows and officials through a single secure experience."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {capabilities.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-[#DCE3EC] bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#173F7A] transition group-hover:bg-[#173F7A] group-hover:text-white">
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#172033]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>

                  <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-[#2563A8]">
                    Learn more
                    <ArrowRight size={13} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-y border-[#DCE3EC] bg-[#F6F8FB]"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <SectionHeading
            eyebrow="Simple journey"
            title="From discovery to post-selection."
            description="A clear end-to-end workflow designed to reduce confusion and make every important step visible."
          />

          <div className="mt-12 overflow-hidden rounded-3xl border border-[#DCE3EC] bg-white">
            <div className="grid divide-y divide-[#DCE3EC] md:grid-cols-5 md:divide-x md:divide-y-0">
              {journey.map((step, index) => (
                <div key={step} className="relative p-6">
                  <div className="flex items-center gap-3 md:block">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173F7A] text-xs font-bold text-white">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <p className="text-sm font-bold text-[#172033] md:mt-5">
                      {step}
                    </p>
                  </div>

                  {index < journey.length - 1 && (
                    <ChevronRight
                      size={17}
                      className="absolute right-4 top-8 hidden text-slate-300 md:block"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Student / Admin CTA */}
      <section id="schemes" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="grid gap-5 lg:grid-cols-2">
            <PortalCard
              icon={Users}
              eyebrow="For students"
              title="Discover opportunities that may fit your profile."
              description="Complete your profile, explore schemes, check eligibility guidance, submit applications and track official progress."
              href="/student"
              button="Open Student Portal"
            />

            <PortalCard
              icon={ShieldCheck}
              eyebrow="For officials"
              title="Manage applications with clear oversight."
              description="Review applications, inspect documents, manage deficiencies, configure schemes and monitor workflow progress."
              href="/admin"
              button="Open Admin Portal"
              dark
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-[#DCE3EC] bg-[#F6F8FB]">
        <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
          <SectionHeading
            eyebrow="Frequently asked"
            title="Designed for clarity and accountability."
            description="The platform keeps AI assistance separate from official decisions."
          />

          <div className="mt-10 space-y-3">
            <Faq
              question="Does AI make the final eligibility or selection decision?"
              answer="No. AI is used to assist with scheme discovery, document checks and workflow support. Final decisions remain subject to approved scheme rules and authorized human review."
            />

            <Faq
              question="Can students correct a document after submitting an application?"
              answer="Yes. When a deficiency is identified, the student can be notified about the issue and resubmit the affected document or information without restarting the complete application."
            />

            <Faq
              question="Can multiple scholarship and fellowship schemes use the platform?"
              answer="Yes. The platform is designed around configurable scheme data, eligibility rules, required documents, application fields and workflow stages."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DCE3EC] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold text-[#172033]">
              Scholarship & Fellowship Management System
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ministry of Tribal Affairs · Smart Education
            </p>
          </div>

          <p className="text-xs text-slate-400">
            AI-assisted workflows · Human oversight · Secure by design
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ---------------- Components ---------------- */

function DashboardStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#DCE3EC] bg-white p-3">
      <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[#172033]">{value}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2563A8]">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#172033] sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function PortalCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  href,
  button,
  dark = false,
}: {
  icon: typeof Users;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  button: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-8 lg:p-10 ${
        dark
          ? 'border-[#173F7A] bg-[#173F7A] text-white'
          : 'border-[#DCE3EC] bg-white'
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          dark ? 'bg-white/10 text-white' : 'bg-blue-50 text-[#173F7A]'
        }`}
      >
        <Icon size={21} />
      </div>

      <p
        className={`mt-7 text-xs font-bold uppercase tracking-[0.14em] ${
          dark ? 'text-blue-100' : 'text-[#2563A8]'
        }`}
      >
        {eyebrow}
      </p>

      <h3
        className={`mt-3 text-2xl font-bold tracking-tight ${
          dark ? 'text-white' : 'text-[#172033]'
        }`}
      >
        {title}
      </h3>

      <p
        className={`mt-4 max-w-xl text-sm leading-7 ${
          dark ? 'text-blue-100' : 'text-slate-600'
        }`}
      >
        {description}
      </p>

      <Link
        href={href}
        className={`mt-7 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
          dark
            ? 'bg-white text-[#173F7A] hover:bg-blue-50'
            : 'bg-[#173F7A] text-white hover:bg-[#123362]'
        }`}
      >
        {button}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function Faq({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-2xl border border-[#DCE3EC] bg-white p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#172033]">
        {question}

        <ChevronRight
          size={17}
          className="shrink-0 text-slate-400 transition-transform group-open:rotate-90"
        />
      </summary>

      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
        {answer}
      </p>
    </details>
  );
}