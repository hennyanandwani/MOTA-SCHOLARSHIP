import type { NotificationCategory, NotificationStatus } from '@/lib/notifications';

export type NotificationCategoryFilter = 'all' | NotificationCategory;
export type NotificationStatusFilter = 'all' | NotificationStatus;
export type NotificationSort = 'newest' | 'oldest';

const fieldClass = 'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';

export function NotificationFilters({ search, category, status, sort, onSearch, onCategory, onStatus, onSort, onReset }: { search: string; category: NotificationCategoryFilter; status: NotificationStatusFilter; sort: NotificationSort; onSearch: (value: string) => void; onCategory: (value: NotificationCategoryFilter) => void; onStatus: (value: NotificationStatusFilter) => void; onSort: (value: NotificationSort) => void; onReset: () => void }) {
  const categories: [NotificationCategoryFilter, string][] = [['all', 'All'], ['application', 'Applications'], ['document', 'Documents'], ['action', 'Action Required'], ['scheme', 'Schemes'], ['system', 'System']];
  return (
    <section aria-label="Search and filter notifications" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(130px,1fr))]">
        <div className="min-w-0 sm:col-span-2 xl:col-span-1"><label htmlFor="notification-search" className="text-xs font-medium text-[#475569]">Search notifications</label><input id="notification-search" type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search notifications..." className={fieldClass} /></div>
        <SelectField id="notification-category" label="Category" value={category} onChange={(value) => onCategory(value as NotificationCategoryFilter)} options={categories.map(([value, label]) => ({ value, label }))} />
        <SelectField id="notification-status" label="Status" value={status} onChange={(value) => onStatus(value as NotificationStatusFilter)} options={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }]} />
        <SelectField id="notification-sort" label="Sort" value={sort} onChange={(value) => onSort(value as NotificationSort)} options={[{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }]} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1F5] pt-3"><p className="text-[11px] text-[#64748B]">Search by title, message or application ID</p><button type="button" onClick={onReset} className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Reset filters</button></div>
    </section>
  );
}

function SelectField<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: { value: T; label: string }[]; onChange: (value: string) => void }) {
  return <div className="min-w-0"><label htmlFor={id} className="text-xs font-medium text-[#475569]">{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}