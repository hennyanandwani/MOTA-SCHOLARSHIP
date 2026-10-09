import { AuditLogsClient } from '@/components/admin/audit/AuditLogsClient';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { getAdminApplications } from '@/lib/adminData';
import { createInitialRules } from '@/lib/adminRuleData';
import { adminNavigation } from '@/lib/navigation';
import { schemes } from '@/lib/schemes';

export const metadata = {
  title: 'Audit Logs | MoTA Administration',
  description: 'Illustrative audit records for administrative actions, workflow changes, overrides, and security events.',
};

export default function AdminAuditPage() {
  const applications = getAdminApplications();
  const initialRules = createInitialRules(schemes);

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Audit Logs"
        subtitle="Administrative activity and prototype security event history"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1600px]">
          <AuditLogsClient
            applications={applications}
            schemes={schemes.map(({ id, name }) => ({ id, name }))}
            rules={initialRules}
          />
        </div>
      </main>
    </div>
  );
}
