import Link from 'next/link';
import { Bell, CheckCircle2, FileText, Search } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const actions = [
  { label: 'Explore schemes', href: '#recommended-schemes', Icon: Search },
  { label: 'Check eligibility', href: '#recommended-schemes', Icon: CheckCircle2 },
  { label: 'View documents', href: '#action-required', Icon: FileText },
  { label: 'View notifications', href: '#dashboard-stats', Icon: Bell },
];

export function QuickActions() {
  const t = useStudentTranslation();
  return (
    <section aria-labelledby="quick-actions-title" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <h2 id="quick-actions-title" className="text-sm font-semibold text-[#172033]">{t('Quick Actions')}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {actions.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className="flex min-h-11 items-center gap-2 rounded-lg border border-[#DCE3EC] px-3 py-2 text-xs font-medium text-[#334155] transition hover:border-[#9BB7D4] hover:bg-[#F8FAFC]">
            <Icon size={16} className="shrink-0 text-[#2563A8]" aria-hidden="true" />
            <span>{t(label)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}