'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileClock,
  Filter,
  Info,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  ADMIN_AUDIT_STORAGE_KEY,
  AUDIT_ACTION_TYPES,
  AUDIT_MODULES,
  AUDIT_SEVERITIES,
  createInitialAuditEvents,
  isAdminAuditEventList,
  type AdminAuditEvent,
  type AuditActionType,
  type AuditModule,
  type AuditSeverity,
} from '@/lib/adminAuditData';
import type { AdminApplicationRecord } from '@/lib/adminData';
import type { EligibilityRule } from '@/lib/adminRuleData';
import type { Scheme } from '@/lib/schemes';

type Props = {
  applications: AdminApplicationRecord[];
  schemes: Pick<Scheme, 'id' | 'name'>[];
  rules: EligibilityRule[];
};

type SortMode = 'newest' | 'oldest' | 'severity' | 'module';

const severityRank: Record<AuditSeverity, number> = {
  Critical: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  Info: 1,
};

const severityStyles: Record<AuditSeverity, string> = {
  Info: 'border-[#D6E1EF] bg-[#EEF4FB] text-[#173F7A]',
  Low: 'border-[#DCE3EC] bg-[#F1F5F9] text-[#475569]',
  Medium: 'border-[#E4C98F] bg-[#FFF8E8] text-[#79520F]',
  High: 'border-[#E8C9A9] bg-[#FFF4E8] text-[#8A4B12]',
  Critical: 'border-[#F0C7CA] bg-[#FDF0F0] text-[#96313B]',
};

const moduleRoutes: Record<AuditModule, string> = {
  Applications: '/admin/applications',
  Verification: '/admin/verification',
  Deficiencies: '/admin/deficiencies',
  Screening: '/admin/screening',
  Selection: '/admin/selection',
  Schemes: '/admin/schemes',
  Rules: '/admin/rules',
  Communications: '/admin/communications',
  Authentication: '/admin',
  System: '/admin',
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function dateValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA').format(date);
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadCsv(events: AdminAuditEvent[]): void {
  const headings = [
    'Data Classification',
    'Event ID',
    'Timestamp',
    'User',
    'Role',
    'Action',
    'Module',
    'Reference',
    'Previous State',
    'New State',
    'Severity',
    'IP',
    'Session',
  ];
  const rows = events.map((event) => [
    'Demo / Illustrative',
    event.id,
    event.timestamp,
    event.userName,
    event.role,
    event.action,
    event.module,
    event.referenceId ?? event.applicationId ?? '',
    event.configuration
      ? `${event.configuration.changedField}: ${event.configuration.previousValue}`
      : event.previousState ?? '',
    event.configuration
      ? `${event.configuration.changedField}: ${event.configuration.newValue}`
      : event.newState ?? '',
    event.severity,
    event.security?.ipAddress ?? '',
    event.security?.sessionId ?? '',
  ]);
  const content = [headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mota-demo-audit-logs.csv';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-bold ${severityStyles[severity]}`}>
      {severity === 'Critical' || severity === 'High'
        ? <AlertTriangle size={12} aria-hidden="true" />
        : <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {severity}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative min-w-0">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none border border-[#DCE3EC] bg-white px-3 pr-8 text-xs font-medium text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-3 text-[#64748B]"
        aria-hidden="true"
      />
    </label>
  );
}

export function AuditLogsClient({ applications, schemes, rules }: Props) {
  const initialEvents = useMemo(
    () => createInitialAuditEvents({ applications, schemes, rules }),
    [applications, schemes, rules],
  );
  const [events, setEvents] = useState<AdminAuditEvent[]>(initialEvents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [storageMessage, setStorageMessage] = useState('');
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [overridesOnly, setOverridesOnly] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isAdminAuditEventList(parsed)) {
          setEvents(parsed);
        } else {
          setStorageMessage('Saved audit demo data is invalid. Illustrative seed records are shown.');
        }
      }
    } catch {
      setStorageMessage('Saved audit data is unavailable. The demo records remain available for this session.');
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(ADMIN_AUDIT_STORAGE_KEY, JSON.stringify(events));
    } catch {
      setStorageMessage('Audit demo records could not be persisted in this browser. They remain available for this session.');
    }
  }, [events, hydrated]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const matching = events.filter((event) => {
      const searchable = [
        event.id,
        event.userId,
        event.userName,
        event.action,
        event.module,
        event.referenceId,
        event.applicationId,
        event.schemeName,
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      const eventDate = dateValue(event.timestamp);
      if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
      if (moduleFilter !== 'all' && event.module !== moduleFilter) return false;
      if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
      if (actionTypeFilter !== 'all' && event.actionType !== actionTypeFilter) return false;
      if (userFilter !== 'all' && event.userId !== userFilter) return false;
      if (dateFrom && eventDate < dateFrom) return false;
      if (dateTo && eventDate > dateTo) return false;
      if (overridesOnly && !event.override) return false;
      return true;
    });

    return matching.sort((a, b) => {
      if (sort === 'oldest') return a.timestamp.localeCompare(b.timestamp);
      if (sort === 'severity') {
        return severityRank[b.severity] - severityRank[a.severity] || b.timestamp.localeCompare(a.timestamp);
      }
      if (sort === 'module') {
        return a.module.localeCompare(b.module) || b.timestamp.localeCompare(a.timestamp);
      }
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [events, search, moduleFilter, severityFilter, actionTypeFilter, userFilter, dateFrom, dateTo, sort, overridesOnly]);

  const selectedEvent = selectedId
    ? events.find((event) => event.id === selectedId) ?? null
    : null;
  const today = dateValue(new Date().toISOString());
  const metrics = useMemo(() => ({
    total: events.length,
    today: events.filter((event) => dateValue(event.timestamp) === today).length,
    critical: events.filter((event) => event.severity === 'Critical').length,
    administrative: events.filter((event) => !['Authentication', 'System'].includes(event.module)).length,
    security: events.filter((event) => event.actionType === 'Security' || Boolean(event.security)).length,
  }), [events, today]);

  const users = useMemo(
    () => [...new Map(events.map((event) => [event.userId, event.userName])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1])),
    [events],
  );
  const priorityEvents = filteredEvents.filter((event) =>
    event.severity === 'Critical' ||
    event.severity === 'High' ||
    event.actionType === 'Security' ||
    Boolean(event.override),
  );
  const overrides = filteredEvents.filter((event) => event.override);

  function resetFilters() {
    setSearch('');
    setModuleFilter('all');
    setSeverityFilter('all');
    setActionTypeFilter('all');
    setUserFilter('all');
    setDateFrom('');
    setDateTo('');
    setSort('newest');
    setOverridesOnly(false);
  }

  function openEvent(eventId: string) {
    setSelectedId(eventId);
  }

  return (
    <section className="space-y-5 text-[#172033]">
      <div className="flex flex-col gap-3 border-b border-[#DCE3EC] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748B]">Administration / Oversight</span>
            <span className="border border-[#D6E1EF] bg-[#EEF4FB] px-2 py-0.5 text-[10px] font-bold tracking-[0.09em] text-[#173F7A]">DEMO AUDIT LOGS</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172033] sm:text-[28px]">Audit Logs</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748B]">Track administrative actions, workflow changes, approvals, overrides, and security-related events across the scholarship management system.</p>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(filteredEvents)}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start border border-[#C9D4E2] bg-white px-4 py-2 text-sm font-semibold text-[#173F7A] transition-colors hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8]"
        >
          <ArrowDownToLine size={16} aria-hidden="true" /> Export Logs
        </button>
      </div>

      {storageMessage && (
        <div role="status" className="flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{storageMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-2 border border-[#DCE3EC] bg-white sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Total Events', value: metrics.total, icon: FileClock, color: 'text-[#173F7A]' },
          { label: "Today's Events", value: metrics.today, icon: Clock3, color: 'text-[#173F7A]' },
          { label: 'Critical Events', value: metrics.critical, icon: ShieldAlert, color: 'text-[#96313B]' },
          { label: 'Administrative Actions', value: metrics.administrative, icon: ArrowLeftRight, color: 'text-[#475569]' },
          { label: 'Security Events', value: metrics.security, icon: LockKeyhole, color: 'text-[#79520F]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="min-h-[92px] border-b border-r border-[#DCE3EC] p-3 last:border-r-0 sm:p-4 lg:border-b-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-[#64748B]">{label}</span>
              <Icon size={16} className={color} aria-hidden="true" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-[#172033]">{value.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      <section aria-labelledby="audit-trail-heading" className="flex flex-col gap-2 border border-[#D6E1EF] bg-[#F8FAFD] p-3 sm:flex-row sm:items-start">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />
        <div>
          <h3 id="audit-trail-heading" className="text-sm font-bold text-[#172033]">Audit Trail</h3>
          <p className="mt-0.5 text-xs leading-5 text-[#475569]">Administrative activity is recorded as an audit trail to support accountability and traceability. These records are prototype data and are not cryptographically immutable or stored in a production government audit system.</p>
          <p className="mt-1 text-[11px] font-semibold text-[#64748B]">All records and security metadata on this page are demo / illustrative.</p>
        </div>
      </section>

      <section aria-labelledby="priority-events-heading" className="border border-[#DCE3EC] bg-white">
        <div className="flex flex-col gap-1 border-b border-[#DCE3EC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="priority-events-heading" className="text-sm font-bold">Important events</h3>
            <p className="text-xs text-[#64748B]">High-priority workflow changes, official overrides, and illustrative security events.</p>
          </div>
          <span className="text-xs font-semibold text-[#64748B]">{priorityEvents.length} matching</span>
        </div>
        {priorityEvents.length ? (
          <div className="grid gap-px bg-[#DCE3EC] sm:grid-cols-2 xl:grid-cols-4">
            {priorityEvents.slice(0, 4).map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => openEvent(event.id)}
                className="min-w-0 bg-white p-3 text-left transition-colors hover:bg-[#F8FAFD] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SeverityBadge severity={event.severity} />
                  {event.override && <span className="text-[10px] font-semibold text-[#79520F]">Official reason recorded</span>}
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-[#172033]">{event.action}</p>
                <p className="mt-1 truncate text-xs text-[#64748B]">{event.module} · {event.referenceId ?? 'No linked reference'}</p>
                <time className="mt-1 block text-[10px] text-[#64748B]" dateTime={event.timestamp}>{formatTimestamp(event.timestamp)}</time>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-4 py-5 text-sm text-[#64748B]">No high-priority or security events match the current filters.</p>
        )}
      </section>

      <section aria-labelledby="audit-registry-heading" className="border border-[#DCE3EC] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#DCE3EC] p-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 id="audit-registry-heading" className="text-base font-bold">Audit log registry</h3>
            <p className="mt-0.5 text-xs text-[#64748B]">Illustrative events only. Select a record to inspect its context and activity timeline.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-9 items-center gap-2 border border-[#DCE3EC] px-2.5 text-xs font-medium text-[#334155]">
              <input
                type="checkbox"
                checked={overridesOnly}
                onChange={(event) => setOverridesOnly(event.target.checked)}
                className="h-4 w-4 accent-[#173F7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8]"
              />
              Official overrides only
            </label>
            <label className="relative">
              <span className="sr-only">Sort audit logs</span>
              <select
                aria-label="Sort audit logs"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="h-9 appearance-none border border-[#DCE3EC] bg-white py-1 pl-3 pr-8 text-xs font-medium outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="severity">Severity</option>
                <option value="module">Module</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-[#64748B]" aria-hidden="true" />
            </label>
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-9 border border-[#DCE3EC] px-3 text-xs font-semibold text-[#475569] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 border-b border-[#DCE3EC] bg-[#FAFBFD] p-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search by event ID, officer, action, or reference</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ID, officer, action, reference"
              className="h-10 w-full border border-[#DCE3EC] bg-white pl-9 pr-3 text-xs outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
            />
          </label>
          <FilterSelect label="Filter by module" value={moduleFilter} onChange={setModuleFilter}>
            <option value="all">All modules</option>
            {AUDIT_MODULES.map((module) => <option key={module} value={module}>{module}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by severity" value={severityFilter} onChange={setSeverityFilter}>
            <option value="all">All severities</option>
            {AUDIT_SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by action type" value={actionTypeFilter} onChange={setActionTypeFilter}>
            <option value="all">All action types</option>
            {AUDIT_ACTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by officer or user" value={userFilter} onChange={setUserFilter}>
            <option value="all">All officers / users</option>
            {users.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </FilterSelect>
          <label className="flex h-10 items-center gap-2 border border-[#DCE3EC] bg-white px-2.5">
            <CalendarDays size={14} className="shrink-0 text-[#64748B]" aria-hidden="true" />
            <span className="sr-only">From date</span>
            <input
              type="date"
              aria-label="From date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs text-[#334155] outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]/20"
            />
          </label>
          <label className="flex h-10 items-center gap-2 border border-[#DCE3EC] bg-white px-2.5">
            <CalendarDays size={14} className="shrink-0 text-[#64748B]" aria-hidden="true" />
            <span className="sr-only">To date</span>
            <input
              type="date"
              aria-label="To date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs text-[#334155] outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]/20"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-[#DCE3EC] px-4 py-2 text-xs text-[#64748B]">
          <span><Filter size={13} className="mr-1 inline" aria-hidden="true" />Showing {filteredEvents.length} of {events.length} demo events</span>
          {overridesOnly && <span className="font-semibold text-[#79520F]">Official override filter active</span>}
        </div>

        {!filteredEvents.length ? (
          <p className="px-4 py-10 text-center text-sm text-[#64748B]">No audit records match these filters.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1400px] border-collapse text-left">
                <thead className="bg-[#F8FAFD] text-[10px] uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-semibold">Timestamp</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Event ID</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Officer / User</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Action</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Module</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Application / Reference</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Previous State</th>
                    <th scope="col" className="px-3 py-3 font-semibold">New State</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Severity</th>
                    <th scope="col" className="px-3 py-3 font-semibold">IP / Session</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF3] text-xs">
                  {filteredEvents.map((event) => <AuditTableRow key={event.id} event={event} onOpen={openEvent} />)}
                </tbody>
              </table>
            </div>

            <div className="hidden overflow-x-auto md:block xl:hidden">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead className="bg-[#F8FAFD] text-[10px] uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-semibold">Timestamp / ID</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Officer / Action</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Module</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Reference</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Severity</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF3] text-xs">
                  {filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="px-3 py-3 align-top">
                        <span className="block whitespace-nowrap text-[#475569]">{formatTimestamp(event.timestamp)}</span>
                        <span className="mt-1 block font-mono text-[10px] text-[#64748B]">{event.id}</span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="block font-semibold">{event.userName}</span>
                        <span className="mt-1 block text-[#64748B]">{event.action}</span>
                      </td>
                      <td className="px-3 py-3 align-top">{event.module}</td>
                      <td className="px-3 py-3 align-top font-mono text-[10px]">{event.applicationId ?? event.referenceId ?? '—'}</td>
                      <td className="px-3 py-3 align-top"><SeverityBadge severity={event.severity} /></td>
                      <td className="px-3 py-3 align-top"><InspectButton event={event} onOpen={openEvent} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#E8EDF3] md:hidden">
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openEvent(event.id)}
                  className="block w-full p-3 text-left transition-colors hover:bg-[#F8FAFD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563A8]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block truncate font-mono text-[10px] text-[#64748B]">{event.id}</span>
                      <span className="mt-1 block text-sm font-semibold">{event.action}</span>
                    </div>
                    <SeverityBadge severity={event.severity} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <span className="text-[#64748B]">Timestamp</span><time dateTime={event.timestamp}>{formatTimestamp(event.timestamp)}</time>
                    <span className="text-[#64748B]">Officer / User</span><span className="truncate">{event.userName}</span>
                    <span className="text-[#64748B]">Module</span><span>{event.module}</span>
                    <span className="text-[#64748B]">Reference</span><span className="truncate font-mono">{event.applicationId ?? event.referenceId ?? '—'}</span>
                  </div>
                  {event.override && <span className="mt-2 inline-block text-[10px] font-semibold text-[#79520F]">Official override recorded with reason</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="overrides-heading" className="border border-[#DCE3EC] bg-white">
        <div className="flex flex-col gap-1 border-b border-[#DCE3EC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="overrides-heading" className="text-sm font-bold">Official Overrides</h3>
            <p className="text-xs text-[#64748B]">Official override recorded with reason. Review status is illustrative.</p>
          </div>
          <button
            type="button"
            onClick={() => setOverridesOnly((current) => !current)}
            aria-pressed={overridesOnly}
            className={`min-h-9 border px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] ${overridesOnly ? 'border-[#173F7A] bg-[#EEF4FB] text-[#173F7A]' : 'border-[#DCE3EC] text-[#475569] hover:bg-[#F6F8FB]'}`}
          >
            {overridesOnly ? 'Showing overrides in registry' : 'Filter registry to overrides'}
          </button>
        </div>
        {overrides.length ? (
          <div className="divide-y divide-[#E8EDF3]">
            {overrides.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => openEvent(event.id)}
                className="grid w-full gap-2 p-3 text-left transition-colors hover:bg-[#F8FAFD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563A8] sm:grid-cols-[1.1fr_1fr_1.2fr_1.5fr_1.4fr]"
              >
                <span><span className="block text-[10px] text-[#64748B]">Officer · Timestamp</span><span className="mt-1 block text-xs font-semibold">{event.userName}</span><time dateTime={event.timestamp} className="block text-[10px] text-[#64748B]">{formatTimestamp(event.timestamp)}</time></span>
                <span><span className="block text-[10px] text-[#64748B]">Module · Reference</span><span className="mt-1 block text-xs font-semibold">{event.module}</span><span className="block truncate font-mono text-[10px] text-[#64748B]">{event.applicationId ?? event.referenceId ?? '—'}</span></span>
                <span><span className="block text-[10px] text-[#64748B]">Previous → New</span><span className="mt-1 block text-xs">{event.previousState ?? '—'} → {event.newState ?? '—'}</span></span>
                <span><span className="block text-[10px] text-[#64748B]">Reason</span><span className="mt-1 block text-xs">{event.override?.reason}</span></span>
                <span><span className="block text-[10px] text-[#64748B]">Review status</span><span className="mt-1 inline-block border border-[#E4C98F] bg-[#FFF8E8] px-2 py-1 text-[10px] font-semibold text-[#79520F]">{event.override?.reviewStatus}</span></span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-4 py-5 text-sm text-[#64748B]">No official overrides match the current filters.</p>
        )}
      </section>

      <p className="border-t border-[#DCE3EC] pt-3 text-[11px] leading-5 text-[#64748B]">
        Prototype / Intended Production Capability: audit trails may support stronger integrity controls in a future production system. This demonstration does not claim immutable storage or connection to government security infrastructure.
      </p>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-[#172033]/35"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null);
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-inspector-title"
            className="absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto border-l border-[#DCE3EC] bg-white shadow-xl sm:max-w-xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#DCE3EC] bg-white px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">Demo event inspector</span>
                <h3 id="audit-inspector-title" className="mt-1 break-all text-lg font-bold text-[#172033]">{selectedEvent.action}</h3>
                <p className="mt-1 font-mono text-xs text-[#64748B]">{selectedEvent.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close audit event inspector"
                className="rounded p-2 text-[#64748B] hover:bg-[#F1F5F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              <InspectorSection title="Event Details">
                <DetailList items={[
                  ['Event ID', selectedEvent.id],
                  ['Timestamp', formatTimestamp(selectedEvent.timestamp)],
                  ['Officer / User', selectedEvent.userName],
                  ['User ID', selectedEvent.userId],
                  ['Role', selectedEvent.role],
                  ['Module', selectedEvent.module],
                  ['Action', selectedEvent.action],
                  ['Severity', selectedEvent.severity],
                ]} />
              </InspectorSection>

              {(selectedEvent.applicationId || selectedEvent.schemeName || selectedEvent.referenceId || selectedEvent.relatedRecord) && (
                <InspectorSection title="Reference">
                  <div className="space-y-3 text-xs">
                    {selectedEvent.applicationId && <ReferenceLink label="Application ID" value={selectedEvent.applicationId} href={moduleRoutes.Applications} />}
                    {selectedEvent.schemeName && <ReferenceLink label="Scheme" value={selectedEvent.schemeName} href={moduleRoutes.Schemes} />}
                    {selectedEvent.referenceId && (
                      <ReferenceLink
                        label={selectedEvent.module === 'Applications' ? 'Application reference' : `${selectedEvent.module} reference`}
                        value={selectedEvent.referenceId}
                        href={moduleRoutes[selectedEvent.module]}
                      />
                    )}
                    {selectedEvent.relatedRecord && <DetailList items={ [['Related record', selectedEvent.relatedRecord]] } />}
                    {selectedEvent.applicationId && <p className="border-l-2 border-[#DCE3EC] pl-2 text-[11px] text-[#64748B]">Applicant personal details are not displayed in this prototype audit view.</p>}
                  </div>
                </InspectorSection>
              )}

              {(selectedEvent.previousState || selectedEvent.newState || selectedEvent.configuration) && (
                <InspectorSection title="State Change">
                  {selectedEvent.configuration ? (
                    <div className="space-y-3">
                      <DetailList items={[
                        ...(selectedEvent.configuration.ruleId ? [['Rule ID', selectedEvent.configuration.ruleId] as [string, string]] : []),
                        ...(selectedEvent.configuration.schemeName ? [['Scheme', selectedEvent.configuration.schemeName] as [string, string]] : []),
                        ['Changed field', selectedEvent.configuration.changedField],
                      ]} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <StateCard label="Previous State" value={selectedEvent.configuration.previousValue} />
                        <StateCard label="New State" value={selectedEvent.configuration.newValue} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <StateCard label="Previous State" value={selectedEvent.previousState ?? 'Not recorded'} />
                      <StateCard label="New State" value={selectedEvent.newState ?? 'Not recorded'} />
                    </div>
                  )}
                </InspectorSection>
              )}

              {selectedEvent.override && (
                <InspectorSection title="Official Override">
                  <div className="space-y-2">
                    <p className="border border-[#E4C98F] bg-[#FFF8E8] p-3 text-xs leading-5 text-[#62450F]">Official override recorded with reason. The system did not make this decision.</p>
                    <DetailList items={[
                      ['Official reason', selectedEvent.override.reason],
                      ['Review status', selectedEvent.override.reviewStatus],
                    ]} />
                  </div>
                </InspectorSection>
              )}

              {selectedEvent.security && (
                <InspectorSection title="Security Information">
                  <p className="mb-3 border-l-2 border-[#E4C98F] pl-2 text-[11px] text-[#79520F]">Demo / illustrative security metadata — not real government security records.</p>
                  <DetailList items={[
                    ...(selectedEvent.security.ipAddress ? [['IP address', selectedEvent.security.ipAddress] as [string, string]] : []),
                    ...(selectedEvent.security.sessionId ? [['Session ID', selectedEvent.security.sessionId] as [string, string]] : []),
                    ...(selectedEvent.security.deviceBrowser ? [['Device / Browser', selectedEvent.security.deviceBrowser] as [string, string]] : []),
                    ...(selectedEvent.security.authenticationResult ? [['Authentication result', selectedEvent.security.authenticationResult] as [string, string]] : []),
                    ...(selectedEvent.security.securityEventType ? [['Security event type', selectedEvent.security.securityEventType] as [string, string]] : []),
                  ]} />
                </InspectorSection>
              )}

              <InspectorSection title="Audit Timeline">
                <p className="mb-3 text-[10px] font-semibold text-[#64748B]">Prototype / demo activity</p>
                <ol className="space-y-0">
                  {[...selectedEvent.activity]
                    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                    .map((entry, index) => (
                      <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                        <span className="relative mt-1 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-[#A9BED8] bg-[#EEF4FB]">
                          {index === selectedEvent.activity.length - 1 && <span className="h-1.5 w-1.5 rounded-full bg-[#173F7A]" />}
                        </span>
                        {index < selectedEvent.activity.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[5px] top-4 w-px bg-[#DCE3EC]" />}
                        <span className="min-w-0">
                          <time dateTime={entry.timestamp} className="block text-[10px] text-[#64748B]">{formatTimestamp(entry.timestamp)}</time>
                          <span className="mt-0.5 block text-xs leading-5 text-[#334155]">{entry.description}</span>
                        </span>
                      </li>
                    ))}
                </ol>
              </InspectorSection>

              <nav aria-label="Related administration module" className="border-t border-[#DCE3EC] pt-4">
                <Link
                  href={moduleRoutes[selectedEvent.module]}
                  className="inline-flex min-h-9 items-center border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"
                >
                  Open {selectedEvent.module} module
                </Link>
              </nav>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function AuditTableRow({ event, onOpen }: { event: AdminAuditEvent; onOpen: (id: string) => void }) {
  const openFromKeyboard = (keyboardEvent: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      onOpen(event.id);
    }
  };
  return (
    <tr
      tabIndex={0}
      aria-label={`Inspect ${event.action}, event ${event.id}`}
      onClick={() => onOpen(event.id)}
      onKeyDown={openFromKeyboard}
      className="cursor-pointer outline-none hover:bg-[#F8FAFD] focus-visible:bg-[#EEF4FB] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563A8]"
    >
      <td className="whitespace-nowrap px-3 py-3 align-top text-[#475569]">{formatTimestamp(event.timestamp)}</td>
      <td className="whitespace-nowrap px-3 py-3 align-top font-mono text-[10px] text-[#475569]">{event.id}</td>
      <td className="px-3 py-3 align-top"><span className="block font-semibold">{event.userName}</span><span className="mt-1 block text-[10px] text-[#64748B]">{event.role}</span></td>
      <td className="max-w-[180px] px-3 py-3 align-top"><span className="block font-semibold">{event.action}</span>{event.override && <span className="mt-1 block text-[10px] text-[#79520F]">Reason recorded</span>}</td>
      <td className="px-3 py-3 align-top">{event.module}</td>
      <td className="max-w-[170px] px-3 py-3 align-top font-mono text-[10px]">{event.applicationId ?? event.referenceId ?? '—'}</td>
      <td className="max-w-[150px] px-3 py-3 align-top text-[#475569]">{event.configuration ? `${event.configuration.changedField}: ${event.configuration.previousValue}` : event.previousState ?? '—'}</td>
      <td className="max-w-[150px] px-3 py-3 align-top text-[#475569]">{event.configuration ? `${event.configuration.changedField}: ${event.configuration.newValue}` : event.newState ?? '—'}</td>
      <td className="px-3 py-3 align-top"><SeverityBadge severity={event.severity} /></td>
      <td className="max-w-[145px] px-3 py-3 align-top font-mono text-[10px] text-[#64748B]">{event.security ? <>{event.security.ipAddress ?? '—'}<br />{event.security.sessionId ?? '—'}</> : '—'}</td>
      <td className="px-3 py-3 align-top"><InspectButton event={event} onOpen={onOpen} /></td>
    </tr>
  );
}

function InspectButton({ event, onOpen }: { event: AdminAuditEvent; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onOpen(event.id);
      }}
      aria-label={`Inspect event ${event.id}`}
      className="border border-[#C9D4E2] px-2.5 py-1.5 text-[10px] font-semibold text-[#173F7A] hover:bg-[#EEF4FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"
    >
      Inspect
    </button>
  );
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-[#DCE3EC]">
      <h4 className="border-b border-[#DCE3EC] bg-[#F8FAFD] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#475569]">{title}</h4>
      <div className="p-3">{children}</div>
    </section>
  );
}

function DetailList({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(110px,0.7fr)_1.3fr]">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-[11px] font-medium text-[#64748B]">{label}</dt>
          <dd className="min-w-0 break-words text-xs font-medium text-[#172033]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border border-[#DCE3EC] p-3">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-[#64748B]">{label}</span>
      <span className="mt-1 block break-words text-xs font-semibold text-[#172033]">{value}</span>
    </div>
  );
}

function ReferenceLink({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <p>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</span>
      <Link href={href} className="break-words font-semibold text-[#173F7A] underline decoration-[#A9BED8] underline-offset-2 hover:text-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
        {value}
      </Link>
    </p>
  );
}
