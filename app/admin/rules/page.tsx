import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { RuleConfigurationClient } from '@/components/admin/rules/RuleConfigurationClient';
import { schemes } from '@/lib/schemes';
import { adminNavigation } from '@/lib/navigation';

export const metadata = {
  title: 'Rule Configuration | MoTA Administration',
  description: 'Configure and preview illustrative scheme eligibility rules for official screening and scrutiny.',
};

export default function AdminRulesPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Rule Configuration"
        subtitle="Configure scheme eligibility rules for screening and scrutiny"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <RuleConfigurationClient schemes={schemes} />
        </div>
      </main>
    </div>
  );
}
