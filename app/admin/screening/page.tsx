import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ScreeningPageClient } from '@/components/admin/screening/ScreeningPageClient';
import { getAdminApplications } from '@/lib/adminData';
import { adminNavigation } from '@/lib/navigation';

export const metadata = {
  title: 'Eligibility & Scrutiny | MoTA Administration',
  description: 'Review illustrative scholarship application records against eligibility criteria for official scrutiny.',
};

export default function AdminScreeningPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar title="Eligibility & Scrutiny" subtitle="Review applications against scheme eligibility criteria" role="MoTA Administration" context="admin" />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <ScreeningPageClient applications={getAdminApplications()} />
        </div>
      </main>
    </div>
  );
}
