import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SchemeExplorer } from '@/components/student/SchemeExplorer';
import { studentNavigation } from '@/lib/navigation';

export default function AllSchemesPage() {
  return (
    <div className="min-h-screen">
      <Topbar
        title="All Schemes"
        subtitle="Explore scholarships and fellowships available through the portal"
      />
      <Sidebar items={studentNavigation} title="Student Portal" />

      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1440px] space-y-5">
          <section className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#172033]">All Schemes</h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Explore scholarships and fellowships available through the portal.
              </p>
            </div>
            <p className="text-xs font-semibold text-[#2563A8]">12 schemes available</p>
          </section>

          <SchemeExplorer />

          <p className="border-t border-[#DCE3EC] pt-4 text-[11px] leading-5 text-[#64748B]">
            Scheme availability and eligibility criteria are subject to official scheme rules and may change.
          </p>
        </div>
      </main>
    </div>
  );
}