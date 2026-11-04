import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { DatabaseSchemeBrowser } from '@/components/student/DatabaseSchemeBrowser';
import { studentNavigation } from '@/lib/navigation';

export default function RecommendedSchemesPage() {
  return (
    <div className="min-h-screen">
      <Topbar
        title="Recommended Schemes"
        subtitle="Scholarship and fellowship opportunities that may fit your profile"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#172033]">Recommended Schemes</h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Browse currently active scholarship and fellowship schemes.
              </p>
            </div>
          </section>

          <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-[#334155]">
            Personalized matching is not configured because eligibility criteria are not stored in the current scheme database. This list shows active schemes only; it does not assess your eligibility.
          </p>
          <DatabaseSchemeBrowser mode="recommended" />
        </div>
      </main>
    </div>
  );
}