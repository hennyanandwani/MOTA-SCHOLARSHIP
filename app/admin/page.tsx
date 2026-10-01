import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { adminNavigation } from '@/lib/navigation';

export default function AdminDashboard() {
  const stats = [['Total applications','12,450'],['Pending verification','2,840'],['Deficiencies','624'],['Under selection','1,420']];
  return <div><Topbar role="MoTA Administration" /><Sidebar items={adminNavigation} title="Administration" /><main className="min-w-0 p-5 lg:ml-64 lg:p-8"><div className="mx-auto max-w-6xl"><p className="text-sm font-medium text-[#2563A8]">Administration</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Overview</h1><p className="mt-1 text-sm text-slate-500">Monitor applications, verification and workflow progress.</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([a, b]) => (
        <div key={a} className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
          <p className="text-xs font-medium text-[#64748B]">{a}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#172033]">{b}</p>
        </div>
      ))}
    </div>
    <div className="mt-7 grid gap-5 lg:grid-cols-2">
      <section className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
        <h2 className="font-semibold text-[#172033]">Application pipeline</h2>
        <div className="mt-5 space-y-4">
          {[
            ['Submitted', '12,450'],
            ['Verification', '4,230'],
            ['Scrutiny', '2,840'],
            ['Screening', '1,420'],
            ['Selection', '840'],
          ].map(([stage, count]) => (
            <div key={stage}>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#64748B]">{stage}</span>
                <span className="font-semibold text-[#172033]">{count}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-[#2563A8]"
                  style={{ width: `${Math.max(8, (Number(count.replace(',', '')) / 12450) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
        <h2 className="font-semibold text-[#172033]">Priority review queue</h2>
        <div className="mt-4 space-y-3">
          {[
            ['NFST-2026-00125', 'Document mismatch'],
            ['NOS-2026-00421', 'Missing document'],
            ['NFST-2026-00781', 'OCR uncertainty'],
          ].map(([id, issue]) => (
            <div key={id} className="rounded-lg border border-[#EEF1F5] bg-[#F8FAFC] p-4">
              <p className="text-xs font-semibold text-[#172033]">{id}</p>
              <p className="mt-1 text-xs text-[#64748B]">{issue}</p>
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-[#173F7A] hover:underline"
              >
                Review application →
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div></main></div>;
}
