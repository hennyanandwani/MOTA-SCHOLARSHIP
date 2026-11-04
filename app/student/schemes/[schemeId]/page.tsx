import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, GraduationCap } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SchemeDetails } from '@/components/student/SchemeDetails';
import { getSchemeWithDetails } from '@/lib/schemeDetails';
import { getPersistedScholarshipScheme } from '@/lib/persistedScholarshipScheme';
import { studentNavigation } from '@/lib/navigation';

export default async function SchemeDetailsPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;
  const data = getSchemeWithDetails(schemeId);

  if (data) {
    return (
      <div className="min-h-screen">
        <Topbar
          title="Scheme Details"
          subtitle="Review scheme information and eligibility guidance"
        />
        <Sidebar items={studentNavigation} title="Student Portal" />
        <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
          <SchemeDetails data={data} />
        </main>
      </div>
    );
  }

  const scheme = await getPersistedScholarshipScheme(schemeId);
  if (!scheme) notFound();

  const SchemeIcon = scheme.type === 'FELLOWSHIP' ? GraduationCap : BookOpen;

  return (
    <div className="min-h-screen">
      <Topbar
        title="Scheme Details"
        subtitle="Review the information currently available for this scheme"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <article className="mx-auto max-w-3xl rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]">
            <SchemeIcon size={20} aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            {scheme.type === 'SCHOLARSHIP' ? 'Scholarship' : 'Fellowship'}
          </p>
          <h1 className="mt-1 break-words text-2xl font-bold text-[#172033]">{scheme.name}</h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#475569]">
            {scheme.description || 'No description has been provided for this scheme.'}
          </p>
          <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-[#334155]">
            Application dates, benefit details, and eligibility criteria are not currently stored for this scheme. Confirm official requirements before applying.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {scheme.isActive ? (
              <Link href={`/student/schemes/${encodeURIComponent(scheme.id)}/apply`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white hover:bg-[#123362]">
                Start application
              </Link>
            ) : (
              <p className="text-sm font-medium text-[#64748B]">This scheme is currently inactive.</p>
            )}
            <Link href="/student/all-schemes" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] px-4 text-sm font-semibold text-[#334155]">
              Back to schemes
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}