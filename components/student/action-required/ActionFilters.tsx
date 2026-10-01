import type { ActionPriority, ActionStatus, ActionType } from '@/lib/actionRequired';

export type ActionTypeFilter = 'All' | ActionType;
export type ActionStatusFilter = 'Open' | 'Resolved';
export type ActionSort = 'Most Recent' | 'Oldest' | 'Priority';

const fieldClass = 'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';

export function ActionFilters({
  search,
  type,
  status,
  sort,
  onSearch,
  onType,
  onStatus,
  onSort,
  onClear,
}: {
  search: string;
  type: ActionTypeFilter;
  status: ActionStatusFilter;
  sort: ActionSort;
  onSearch: (value: string) => void;
  onType: (value: ActionTypeFilter) => void;
  onStatus: (value: ActionStatusFilter) => void;
  onSort: (value: ActionSort) => void;
  onClear: () => void;
}) {
  return (
    <section aria-label="Search and filter action items" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(140px,1fr))]">
        <div className="min-w-0 sm:col-span-2 xl:col-span-1"><label htmlFor="action-search" className="text-xs font-medium text-[#475569]">Search actions</label><input id="action-search" type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search actions..." className={fieldClass} /></div>
        <SelectField id="action-type-filter" label="Filter by" value={type} options={['All', 'Documents', 'Application Information', 'Other']} onChange={(value) => onType(value === 'Documents' ? 'Document' : value as ActionTypeFilter)} />
        <SelectField id="action-status-filter" label="Status" value={status} options={['Open', 'Resolved']} onChange={(value) => onStatus(value as ActionStatusFilter)} />
        <SelectField id="action-sort" label="Sort" value={sort} options={['Most Recent', 'Oldest', 'Priority']} onChange={(value) => onSort(value as ActionSort)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1F5] pt-3"><p className="text-[11px] text-[#64748B]">Filter open and resolved action items</p><button type="button" onClick={onClear} className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Clear Filters</button></div>
    </section>
  );
}

function SelectField<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: readonly string[]; onChange: (value: string) => void }) {
  return <div className="min-w-0"><label htmlFor={id} className="text-xs font-medium text-[#475569]">{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}