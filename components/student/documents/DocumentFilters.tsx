import type { StudentDocumentCategory, StudentDocumentSort, StudentDocumentStatusFilter } from '@/lib/studentDocuments';

const statusOptions: StudentDocumentStatusFilter[] = ['All', 'Verified', 'Under Review', 'Needs Attention', 'Not Uploaded'];
const categoryOptions: (StudentDocumentCategory | 'All')[] = ['All', 'Identity', 'Caste / ST Certificate', 'Income', 'Academic', 'Bank', 'Admission', 'Other'];
const sortOptions: StudentDocumentSort[] = ['Recently Updated', 'Name', 'Status'];
const selectClass = 'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';

export function DocumentFilters({
  search,
  status,
  category,
  sort,
  onSearch,
  onStatus,
  onCategory,
  onSort,
  onClear,
}: {
  search: string;
  status: StudentDocumentStatusFilter;
  category: StudentDocumentCategory | 'All';
  sort: StudentDocumentSort;
  onSearch: (value: string) => void;
  onStatus: (value: StudentDocumentStatusFilter) => void;
  onCategory: (value: StudentDocumentCategory | 'All') => void;
  onSort: (value: StudentDocumentSort) => void;
  onClear: () => void;
}) {
  return (
    <section aria-label="Search and filter documents" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(140px,1fr))]">
        <div className="min-w-0 sm:col-span-2 xl:col-span-1">
          <label htmlFor="document-search" className="text-xs font-medium text-[#475569]">Search documents</label>
          <input id="document-search" type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search documents..." className={selectClass} />
        </div>
        <SelectField id="document-status" label="Status" value={status} options={statusOptions} onChange={(value) => onStatus(value as StudentDocumentStatusFilter)} />
        <SelectField id="document-category" label="Document Type" value={category} options={categoryOptions} onChange={(value) => onCategory(value as StudentDocumentCategory | 'All')} />
        <SelectField id="document-sort" label="Sort" value={sort} options={sortOptions} onChange={(value) => onSort(value as StudentDocumentSort)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1F5] pt-3">
        <p className="text-[11px] text-[#64748B]">Filter your central document library</p>
        <button type="button" onClick={onClear} className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Clear Filters</button>
      </div>
    </section>
  );
}

function SelectField<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: readonly T[]; onChange: (value: string) => void }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-xs font-medium text-[#475569]">{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}