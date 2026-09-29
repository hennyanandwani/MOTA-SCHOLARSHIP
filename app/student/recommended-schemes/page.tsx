import { Sparkles } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ProfileMatchCard } from '@/components/student/ProfileMatchCard';
import { RecommendationInfo } from '@/components/student/RecommendationInfo';
import { RecommendedSchemeCard } from '@/components/student/RecommendedSchemeCard';
import { recommendedSchemes } from '@/lib/recommendedSchemes';
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
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2563A8]">
                <Sparkles size={13} aria-hidden="true" />
                AI-Assisted Guidance
              </div>
              <h1 className="text-2xl font-bold text-[#172033]">Recommended Schemes</h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Scholarship and fellowship opportunities that may fit your profile.
              </p>
            </div>
          </section>

          <ProfileMatchCard />

          <section aria-labelledby="recommended-schemes-heading">
            <div className="mb-4">
              <h2 id="recommended-schemes-heading" className="text-base font-semibold text-[#172033]">
                Schemes that may fit your profile
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">
                These recommendations are guidance only. Review the official eligibility criteria before applying.
              </p>
            </div>
            <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recommendedSchemes.map((scheme) => (
                <RecommendedSchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>
          </section>

          <RecommendationInfo />
        </div>
      </main>
    </div>
  );
}