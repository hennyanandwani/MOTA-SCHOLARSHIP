import { Search } from 'lucide-react';

type SchemeSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SchemeSearch({ value, onChange }: SchemeSearchProps) {
  return (
    <div className="relative min-w-0">
      <label htmlFor="scheme-search" className="sr-only">Search schemes</label>
      <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
      <input
        id="scheme-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search schemes..."
        className="h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white pl-10 pr-3 text-sm text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}