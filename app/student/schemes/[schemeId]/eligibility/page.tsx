import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { studentNavigation } from '@/lib/navigation';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { assessEligibility } from '@/lib/eligibilityReview';
import { getPersistedScholarshipScheme } from '@/lib/persistedScholarshipScheme';
import { getSchemeWithDetails } from '@/lib/schemeDetails';

export default async function EligibilityCheckPage({
  params,
}: {
  params: Promise<{ schemeId: string }>;
}) {
  const { schemeId } = await params;
  const user = await getCurrentAppUser();
  if (!user || !user.student || user.role !== 'STUDENT') redirect('/login');

  const scheme = await getPersistedScholarshipScheme(schemeId);
  const fallbackScheme = scheme ? null : getSchemeWithDetails(schemeId)?.scheme;
  const schemeName = scheme?.name ?? fallbackScheme?.name;
  if (!schemeName) notFound();

  const assessment = assessEligibility(user.student);

  return (
    <div className="min-h-screen">
      <Topbar
        title="Eligibility Check"
        subtitle="Eligibility information based on available scheme data"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <section className="mx-auto max-w-3xl space-y-5">
          <header className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2563A8]">Eligibility status</p>
            <h1 className="mt-2 text-xl font-bold text-[#172033]">{schemeName}</h1>
            <p className="mt-3 text-sm leading-6 text-[#475569]">
              Cannot be determined. The current scheme data does not contain eligibility criteria, so no profile can be confirmed as eligible or ineligible.
            </p>
          </header>

          <section aria-labelledby="profile-fields-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-7">
            <h2 id="profile-fields-heading" className="text-base font-semibold text-[#172033]">Profile information available</h2>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">
              These saved fields may be useful when reviewing official scheme requirements. Missing fields are identified separately; their values are not shown here.
            </p>
            <ul className="mt-4 divide-y divide-[#EEF1F5]">
              {assessment.profileFields.map((field) => (
                <li key={field.key} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-[#334155]">{field.label}</span>
                  <span className={field.provided ? 'font-medium text-[#126747]' : 'font-medium text-[#94600D]'}>
                    {field.provided ? 'Provided' : 'Missing'}
                  </span>
                </li>
              ))}
            </ul>
            {assessment.missingProfileFields.length > 0 && (
              <p className="mt-4 text-sm leading-6 text-[#80520B]">
                Missing profile information: {assessment.missingProfileFields.join(', ')}.
              </p>
            )}
          </section>

          <nav aria-label="Eligibility actions" className="flex flex-wrap gap-3">
            {scheme?.isActive && (
              <Link href={`/student/schemes/${encodeURIComponent(scheme.id)}/apply`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white hover:bg-[#123362]">
                Continue to application
              </Link>
            )}
            <Link href={`/student/schemes/${encodeURIComponent(schemeId)}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] bg-white px-4 text-sm font-semibold text-[#334155]">
              Scheme details
            </Link>
          </nav>
        </section>
      </main>
    </div>
  );
}
