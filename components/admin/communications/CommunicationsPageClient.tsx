'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  Download,
  Edit3,
  Eye,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  ADMIN_COMMUNICATIONS_STORAGE_KEY,
  COMMUNICATION_AUDIENCES,
  COMMUNICATION_CHANNELS,
  COMMUNICATION_STATUSES,
  COMMUNICATION_TYPES,
  createInitialCommunications,
  deliveredPercentage,
  isAdminCommunicationList,
  type AdminCommunication,
  type CommunicationActivity,
  type CommunicationAudience,
  type CommunicationChannel,
  type CommunicationStatus,
  type CommunicationType,
} from '@/lib/adminCommunicationData';
import type { AdminApplicationRecord } from '@/lib/adminData';
import type { DeficiencyRecord } from '@/lib/adminDeficiencyData';
import type { Scheme } from '@/lib/schemes';

type Props = {
  applications: AdminApplicationRecord[];
  schemes: Scheme[];
  deficiencies: DeficiencyRecord[];
};

type FormValues = {
  type: CommunicationType;
  subject: string;
  message: string;
  audience: CommunicationAudience;
  schemeId: string;
  applicationId: string;
  state: string;
  channel: CommunicationChannel;
  sendMode: 'now' | 'schedule';
  scheduledAt: string;
};

const templates: { name: string; type: CommunicationType; subject: string; message: string }[] = [
  {
    name: 'Application Submitted',
    type: 'Application Update',
    subject: 'Application received — next steps',
    message: 'Your application has been received. Please check the portal for updates and ensure your profile and documents remain current.',
  },
  {
    name: 'Deficiency Raised',
    type: 'Deficiency Notice',
    subject: 'Action required: application documents',
    message: 'A document or information item in your application requires attention. Please sign in to the portal to review the details and submit the requested information by the stated deadline.',
  },
  {
    name: 'Correction Required',
    type: 'Deficiency Notice',
    subject: 'Correction required for your application',
    message: 'Please review the deficiency notice associated with your application and submit a corrected document through the portal.',
  },
  {
    name: 'Screening Update',
    type: 'Screening Update',
    subject: 'Application screening status update',
    message: 'Your application is under official screening. Any preliminary status shown in the portal is not a final eligibility decision.',
  },
  {
    name: 'Selection Update',
    type: 'Selection Update',
    subject: 'Selection review status',
    message: 'A selection update is available in your portal. Recommendations remain subject to official review and sanction procedures.',
  },
  {
    name: 'Document Reminder',
    type: 'Document Reminder',
    subject: 'Reminder: complete your application documents',
    message: 'Please review your application checklist and provide any outstanding documents through the portal.',
  },
  {
    name: 'Scheme Announcement',
    type: 'Scheme Announcement',
    subject: 'Scholarship scheme application window',
    message: 'Review the scheme details and application window in the portal. Please refer to the notified guidelines for authoritative information.',
  },
];

const blankForm: FormValues = {
  type: 'General Broadcast',
  subject: '',
  message: '',
  audience: 'All Applicants',
  schemeId: '',
  applicationId: '',
  state: '',
  channel: 'Portal',
  sendMode: 'now',
  scheduledAt: '',
};

const statusStyles: Record<CommunicationStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Scheduled: 'bg-blue-50 text-blue-800',
  Sending: 'bg-amber-50 text-amber-800',
  Sent: 'bg-emerald-50 text-emerald-800',
  Failed: 'bg-rose-50 text-rose-800',
  Cancelled: 'bg-slate-100 text-slate-600',
};

function newActivity(action: string, details: string): CommunicationActivity {
  return {
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    details,
    timestamp: new Date().toISOString(),
    actor: 'MoTA Administrator',
    isDemo: true,
  };
}

function localDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function localDateTimeInput(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function recipientCount(
  audience: CommunicationAudience,
  applicationId: string,
  schemeId: string,
  state: string,
  applications: AdminApplicationRecord[],
): number {
  switch (audience) {
    case 'Specific Application':
      return applicationId ? 1 : 0;
    case 'Specific Scheme':
      return applications.filter((record) => record.schemeId === schemeId).length;
    case 'Selected Applicants':
      return applications.filter((record) => record.status === 'Selected' || record.status === 'Sanctioned').length;
    case 'Pending Applicants':
      return applications.filter((record) => record.status === 'Under Review' || record.status === 'Action Required').length;
    case 'State / Region':
      return applications.filter((record) => record.state === state).length;
    case 'All Applicants':
      return applications.length;
  }
}

export function CommunicationsPageClient({ applications, schemes, deficiencies }: Props) {
  const initialRecords = useMemo(
    () => createInitialCommunications({
      applications,
      schemes: schemes.map(({ id, name }) => ({ id, name })),
      deficiencies,
    }),
    [applications, schemes, deficiencies],
  );
  const [records, setRecords] = useState<AdminCommunication[]>(initialRecords);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(blankForm);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [storageError, setStorageError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [channelFilter, setChannelFilter] = useState('All channels');
  const [audienceFilter, setAudienceFilter] = useState('All audiences');
  const [schemeFilter, setSchemeFilter] = useState('All schemes');
  const [dateFilter, setDateFilter] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'subject'>('newest');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ADMIN_COMMUNICATIONS_STORAGE_KEY);
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored);
        if (isAdminCommunicationList(parsed)) setRecords(parsed);
        else setStorageError('Saved communications could not be read because the stored data is invalid. The illustrative registry is shown.');
      }
    } catch {
      setStorageError('Saved communications could not be loaded from this browser. The illustrative registry is shown.');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(ADMIN_COMMUNICATIONS_STORAGE_KEY, JSON.stringify(records));
      setStorageError('');
    } catch {
      setStorageError('Changes are visible for this session but could not be saved to browser storage.');
    }
  }, [records, hydrated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const applicationId = params.get('applicationId') ?? '';
    const requestedType = params.get('type');
    if (!applicationId && !requestedType) return;
    const application = applications.find((item) => item.applicationId === applicationId);
    if (application || requestedType) {
      setEditingId(null);
      setForm({
        ...blankForm,
        type: COMMUNICATION_TYPES.includes(requestedType as CommunicationType)
          ? requestedType as CommunicationType
          : applicationId ? 'Application Update' : blankForm.type,
        audience: applicationId ? 'Specific Application' : 'All Applicants',
        applicationId,
        schemeId: application?.schemeId ?? params.get('schemeId') ?? '',
      });
      setEditorOpen(true);
    }
  }, [applications]);

  useEffect(() => {
    if (!selectedId && !editorOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (editorOpen) setEditorOpen(false);
      else setSelectedId(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, editorOpen]);

  const selected = records.find((record) => record.id === selectedId) ?? null;
  const schemeById = useMemo(() => new Map(schemes.map((scheme) => [scheme.id, scheme])), [schemes]);
  const stateOptions = useMemo(() => [...new Set(applications.map((app) => app.state))].sort(), [applications]);
  const visibleRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const filtered = records.filter((record) => {
      const matchesQuery = !query || [
        record.id,
        record.subject,
        record.applicantName ?? '',
        record.schemeName ?? '',
        record.applicationId ?? '',
      ].some((value) => value.toLocaleLowerCase().includes(query));
      return matchesQuery &&
        (statusFilter === 'All statuses' || record.status === statusFilter) &&
        (typeFilter === 'All types' || record.type === typeFilter) &&
        (channelFilter === 'All channels' || record.channel === channelFilter) &&
        (audienceFilter === 'All audiences' || record.audience === audienceFilter) &&
        (schemeFilter === 'All schemes' || record.schemeId === schemeFilter) &&
        (!dateFilter || record.createdAt.slice(0, 10) === dateFilter);
    });
    return filtered.sort((a, b) => {
      if (sort === 'subject') return a.subject.localeCompare(b.subject);
      return sort === 'newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt);
    });
  }, [records, search, statusFilter, typeFilter, channelFilter, audienceFilter, schemeFilter, dateFilter, sort]);

  const metrics = useMemo(() => ({
    total: records.length,
    drafts: records.filter((item) => item.status === 'Draft').length,
    scheduled: records.filter((item) => item.status === 'Scheduled').length,
    sent: records.filter((item) => item.status === 'Sent').length,
    attention: records.filter((item) => item.status === 'Failed' || item.status === 'Sending').length,
  }), [records]);

  function openCreate() {
    setEditingId(null);
    setForm(blankForm);
    setFormError('');
    setEditorOpen(true);
  }

  function openEdit(record: AdminCommunication) {
    setEditingId(record.id);
    setForm({
      type: record.type,
      subject: record.subject,
      message: record.message,
      audience: record.audience,
      schemeId: record.schemeId ?? '',
      applicationId: record.applicationId ?? '',
      state: record.state ?? '',
      channel: record.channel,
      sendMode: record.status === 'Scheduled' ? 'schedule' : 'now',
      scheduledAt: localDateTimeInput(record.scheduledAt),
    });
    setFormError('');
    setEditorOpen(true);
  }

  function updateForm<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError('');
  }

  function chooseType(type: CommunicationType) {
    const template = templates.find((item) => item.type === type);
    setForm((current) => ({
      ...current,
      type,
      audience: type === 'Deficiency Notice'
        ? 'Specific Application'
        : type === 'Scheme Announcement'
          ? 'Specific Scheme'
          : current.audience,
      subject: template?.subject ?? current.subject,
      message: template?.message ?? current.message,
    }));
    setFormError('');
  }

  function applyTemplate(name: string) {
    const template = templates.find((item) => item.name === name);
    if (!template) return;
    setForm((current) => ({
      ...current,
      type: template.type,
      subject: template.subject,
      message: template.message,
      audience: template.type === 'Deficiency Notice'
        ? 'Specific Application'
        : template.type === 'Scheme Announcement'
          ? 'Specific Scheme'
          : current.audience,
    }));
  }

  function validateForm(mode: 'draft' | 'schedule' | 'send'): string {
    if (!form.subject.trim()) return 'Enter a subject.';
    if (!form.message.trim()) return 'Enter a message.';
    if (form.audience === 'Specific Application' && !form.applicationId) return 'Select an application for this audience.';
    if (form.audience === 'Specific Application' && !applications.some((item) => item.applicationId === form.applicationId) &&
        !deficiencies.some((item) => item.applicationId === form.applicationId)) return 'Select an application from the available records.';
    if ((form.audience === 'Specific Scheme' || form.type === 'Scheme Announcement') && !form.schemeId) return 'Select a scheme.';
    if (form.audience === 'State / Region' && !form.state) return 'Select a state or region.';
    if (form.type === 'Deficiency Notice' && !form.applicationId) return 'A deficiency notice requires an application ID.';
    if (mode === 'schedule') {
      const scheduleDate = new Date(form.scheduledAt);
      if (!form.scheduledAt || Number.isNaN(scheduleDate.getTime())) return 'Choose a valid scheduled date and time.';
      if (scheduleDate.getTime() <= Date.now()) return 'Schedule time must be in the future.';
    }
    return '';
  }

  function persistForm(mode: 'draft' | 'schedule' | 'send') {
    const error = validateForm(mode);
    if (error) {
      setFormError(error);
      return;
    }
    const application = applications.find((item) => item.applicationId === form.applicationId);
    const deficiency = deficiencies.find((item) => item.applicationId === form.applicationId);
    const scheme = schemeById.get(form.schemeId);
    const now = new Date().toISOString();
    const status: CommunicationStatus = mode === 'schedule' ? 'Scheduled' : mode === 'send' ? 'Sent' : 'Draft';
    const count = recipientCount(form.audience, form.applicationId, form.schemeId, form.state, applications);
    const existing = records.find((item) => item.id === editingId);
    const stats = mode === 'send'
      ? { totalRecipients: count, delivered: 0, pending: 0, failed: 0 }
      : status === 'Scheduled'
        ? { totalRecipients: count, delivered: 0, pending: count, failed: 0 }
        : { totalRecipients: count, delivered: 0, pending: 0, failed: 0 };
    const communication: AdminCommunication = {
      id: existing?.id ?? `COM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      subject: form.subject.trim(),
      type: form.type,
      message: form.message.trim(),
      audience: form.audience,
      recipientCount: count,
      channel: form.channel,
      ...(form.schemeId ? { schemeId: form.schemeId, schemeName: scheme?.name ?? application?.schemeName ?? deficiency?.scheme } : {}),
      ...(form.applicationId ? {
        applicationId: form.applicationId,
        applicantName: application?.applicantName ?? deficiency?.applicantName,
        state: application?.state ?? deficiency?.state,
        category: application?.category ?? 'ST',
      } : form.audience === 'State / Region' ? { state: form.state } : {}),
      status,
      ...(mode === 'schedule' ? { scheduledAt: new Date(form.scheduledAt).toISOString() } : {}),
      createdAt: existing?.createdAt ?? now,
      createdBy: existing?.createdBy ?? 'MoTA Administrator',
      updatedAt: now,
      deliveryStats: stats,
      activity: [
        ...(existing?.activity ?? [newActivity('Communication created', 'Created as a demo communication; no external service is connected.')]),
        newActivity('Audience configured', `${form.audience}${form.applicationId ? ` · ${form.applicationId}` : ''}${form.schemeId ? ` · ${scheme?.name ?? ''}` : ''}`),
        newActivity(
          mode === 'draft' ? (existing ? 'Draft updated' : 'Draft saved') : mode === 'schedule' ? 'Scheduled' : 'Send initiated',
          mode === 'schedule'
            ? 'Scheduled in demo mode. No external delivery service is connected.'
            : mode === 'send'
              ? 'Demo send completed. External delivery is not connected in this prototype.'
              : 'Draft saved locally in this browser.',
        ),
      ],
    };
    setRecords((current) => existing
      ? current.map((item) => item.id === existing.id ? communication : item)
      : [communication, ...current]);
    setSelectedId(communication.id);
    setEditorOpen(false);
    setFeedback(
      mode === 'schedule'
        ? 'Scheduled in demo mode. No external delivery service is connected.'
        : mode === 'send'
          ? 'Demo send completed. External delivery is not connected in this prototype.'
          : 'Draft saved in this browser.',
    );
    setFormError('');
  }

  function updateRecord(id: string, change: (record: AdminCommunication) => AdminCommunication, message: string) {
    setRecords((current) => current.map((record) => record.id === id ? change(record) : record));
    setFeedback(message);
  }

  function cancelCommunication(record: AdminCommunication) {
    if (record.status !== 'Scheduled' && record.status !== 'Draft' && record.status !== 'Failed') return;
    updateRecord(record.id, (item) => ({
      ...item,
      status: 'Cancelled',
      updatedAt: new Date().toISOString(),
      activity: [...item.activity, newActivity('Cancelled', 'Communication cancelled in demo mode.')],
    }), 'Communication cancelled in demo mode.');
  }

  function retryCommunication(record: AdminCommunication) {
    const timestamp = new Date().toISOString();
    updateRecord(record.id, (item) => ({
      ...item,
      status: 'Sent',
      updatedAt: timestamp,
      deliveryStats: {
        totalRecipients: item.recipientCount,
        delivered: 0,
        pending: 0,
        failed: 0,
      },
      activity: [...item.activity, newActivity('Retry initiated', 'Demo retry completed locally. External delivery is not connected.')],
    }), 'Demo retry recorded locally. External delivery is not connected.');
  }

  function duplicateCommunication(record: AdminCommunication) {
    const now = new Date().toISOString();
    const copy: AdminCommunication = {
      ...record,
      id: `COM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      status: 'Draft',
      scheduledAt: undefined,
      createdAt: now,
      updatedAt: now,
      createdBy: 'MoTA Administrator',
      deliveryStats: { totalRecipients: 0, delivered: 0, pending: 0, failed: 0 },
      activity: [newActivity('Communication created', 'Duplicated from an existing demo communication.')],
    };
    setRecords((current) => [copy, ...current]);
    setSelectedId(copy.id);
    setFeedback('A copy was created as a draft.');
  }

  function deleteDraft(record: AdminCommunication) {
    if (record.status !== 'Draft') return;
    setRecords((current) => current.filter((item) => item.id !== record.id));
    setSelectedId(null);
    setFeedback('Draft deleted from this browser.');
  }

  function exportCsv() {
    const headings = ['Communication ID', 'Subject', 'Type', 'Audience', 'Channel', 'Scheme', 'Status', 'Scheduled Date', 'Delivery Status'];
    const rows = visibleRecords.map((record) => [
      record.id, record.subject, record.type, record.audience, record.channel,
      record.schemeName ?? '', record.status, record.scheduledAt ?? '',
      `${record.deliveryStats.delivered} delivered; ${record.deliveryStats.pending} pending; ${record.deliveryStats.failed} failed`,
    ]);
    const csv = [headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mota-demo-communications.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const audienceRequiresScheme = form.audience === 'Specific Scheme' || form.type === 'Scheme Announcement';
  const audienceRequiresApplication = form.audience === 'Specific Application' || form.type === 'Deficiency Notice';

  return (
    <section className="space-y-5 text-[#172033]">
      <div className="flex flex-col gap-3 border-b border-[#DCE3EC] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748B]">Administration / Communications</span>
            <span className="rounded-sm border border-[#D6E1EF] bg-[#EEF4FB] px-2 py-0.5 text-[10px] font-bold tracking-[0.09em] text-[#173F7A]">DEMO COMMUNICATION CENTER</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] sm:text-[28px]">Communications</h1>
          <p className="mt-1 max-w-3xl text-sm text-[#64748B]">Manage official scholarship notifications, deficiency alerts, applicant communication, and Ministry broadcasts.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex min-h-10 items-center justify-center gap-2 self-start bg-[#173F7A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8]">
          <Plus size={16} aria-hidden="true" /> New Communication
        </button>
      </div>

      {(feedback || storageError) && (
        <div role="status" className={`flex items-start justify-between gap-3 border px-3 py-2 text-sm ${storageError ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          <span>{storageError || feedback}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => { setFeedback(''); setStorageError(''); }} className="rounded p-0.5 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-2 border border-[#DCE3EC] bg-white sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Total Communications', value: metrics.total, icon: MessageSquare, color: 'text-[#173F7A]' },
          { label: 'Drafts', value: metrics.drafts, icon: Edit3, color: 'text-slate-600' },
          { label: 'Scheduled', value: metrics.scheduled, icon: CalendarClock, color: 'text-blue-700' },
          { label: 'Sent', value: metrics.sent, icon: Check, color: 'text-emerald-700' },
          { label: 'Failed / Needs Attention', value: metrics.attention, icon: AlertTriangle, color: 'text-amber-700' },
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

      <div className="border border-[#DCE3EC] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#DCE3EC] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold">Communication registry</h2>
            <p className="mt-0.5 text-xs text-[#64748B]">Prototype records and illustrative delivery status only.</p>
            <ol aria-label="Demo communication workflow" className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-[#475569] sm:text-[11px]">
              {['Draft', 'Scheduled', 'Sending', 'Sent'].map((step, index) => <li key={step} className="flex items-center gap-1.5"><span className={`border px-2 py-1 ${step === 'Sent' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[#DCE3EC] bg-white'}`}>{step}</span>{index < 3 && <span aria-hidden="true" className="text-[#94A3B8]">→</span>}</li>)}
              <li className="ml-1 text-[10px] font-normal text-[#64748B]">Local demo workflow; no external delivery.</li>
            </ol>
          </div>
          <button type="button" onClick={exportCsv} className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#C9D4E2] px-3 py-1.5 text-sm font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
            <Download size={15} aria-hidden="true" /> Export CSV
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 border-b border-[#DCE3EC] bg-[#FAFBFD] p-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search communications</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, subject, applicant…" className="h-9 w-full border border-[#DCE3EC] bg-white pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#2563A8] focus:ring-1 focus:ring-[#2563A8]" />
          </label>
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={['All statuses', ...COMMUNICATION_STATUSES]} />
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={['All types', ...COMMUNICATION_TYPES]} />
          <FilterSelect label="Channel" value={channelFilter} onChange={setChannelFilter} options={['All channels', ...COMMUNICATION_CHANNELS]} />
          <FilterSelect label="Audience" value={audienceFilter} onChange={setAudienceFilter} options={['All audiences', ...COMMUNICATION_AUDIENCES]} />
          <FilterSelect label="Scheme" value={schemeFilter} onChange={setSchemeFilter} options={['All schemes', ...schemes.map((item) => item.id)]} renderOption={(value) => value === 'All schemes' ? value : schemes.find((item) => item.id === value)?.name ?? value} />
          <label className="flex h-9 items-center gap-2 border border-[#DCE3EC] bg-white px-2.5 text-xs text-[#64748B]">
            <span className="shrink-0">Created</span>
            <input aria-label="Filter by creation date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-[#172033] outline-none" />
          </label>
          <FilterSelect label="Sort" value={sort} onChange={(value) => setSort(value as typeof sort)} options={['newest', 'oldest', 'subject']} renderOption={(value) => ({ newest: 'Newest first', oldest: 'Oldest first', subject: 'Subject A–Z' }[value] ?? value)} />
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1250px] border-collapse text-left text-sm">
            <thead className="bg-[#F4F7FA] text-[11px] uppercase tracking-wide text-[#64748B]">
              <tr>{['Communication ID', 'Subject / Title', 'Type', 'Audience', 'Channel', 'Related Scheme', 'Created / Scheduled', 'Status', 'Delivery', 'Action'].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap border-b border-[#DCE3EC] px-3 py-3 font-semibold">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => (
                <tr key={record.id} className={`border-b border-[#E9EEF4] last:border-b-0 hover:bg-[#F8FAFC] ${selectedId === record.id ? 'bg-[#F2F6FB]' : ''}`}>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#173F7A]">{record.id}</td>
                  <td className="max-w-[210px] px-3 py-3"><button type="button" onClick={() => setSelectedId(record.id)} className="block max-w-full truncate text-left font-semibold text-[#172033] hover:text-[#2563A8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]" title={record.subject}>{record.subject}</button><span className="mt-0.5 block text-xs text-[#64748B]">{record.applicantName ?? record.applicationId ?? '—'}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">{record.type}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">{record.audience}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">{record.channel}</td>
                  <td className="max-w-[170px] truncate px-3 py-3 text-xs" title={record.schemeName}>{record.schemeName ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">{record.status === 'Scheduled' ? localDate(record.scheduledAt) : localDate(record.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-3"><StatusBadge status={record.status} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-[#64748B]">{record.status === 'Sent' ? record.deliveryStats.delivered === 0 && record.deliveryStats.failed === 0 ? 'Not externally connected' : `${deliveredPercentage(record.deliveryStats)}% illustrative` : record.status === 'Failed' ? `${record.deliveryStats.failed} failed (demo)` : record.status === 'Scheduled' ? 'Awaiting schedule' : '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3"><button type="button" onClick={() => setSelectedId(record.id)} aria-label={`View ${record.id}`} className="inline-flex min-h-8 items-center gap-1 border border-[#DCE3EC] px-2 text-xs font-semibold text-[#173F7A] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><Eye size={14} /> View</button></td>
                </tr>
              ))}
              {visibleRecords.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-[#64748B]">No communications match the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="hidden overflow-x-auto md:block lg:hidden">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-[#F4F7FA] text-[11px] uppercase tracking-wide text-[#64748B]">
              <tr>{['Communication ID', 'Subject', 'Type', 'Audience', 'Status', 'Action'].map((heading) => <th key={heading} scope="col" className="border-b border-[#DCE3EC] px-3 py-3 font-semibold">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => <tr key={record.id} className="border-b border-[#E9EEF4]">
                <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-[#173F7A]">{record.id}</td>
                <td className="max-w-[230px] truncate px-3 py-3 text-xs font-semibold" title={record.subject}>{record.subject}</td>
                <td className="whitespace-nowrap px-3 py-3 text-xs">{record.type}</td>
                <td className="whitespace-nowrap px-3 py-3 text-xs">{record.audience}</td>
                <td className="whitespace-nowrap px-3 py-3"><StatusBadge status={record.status} /></td>
                <td className="whitespace-nowrap px-3 py-3"><button type="button" onClick={() => setSelectedId(record.id)} className="min-h-8 border border-[#DCE3EC] px-2 text-xs font-semibold text-[#173F7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">View</button></td>
              </tr>)}
              {visibleRecords.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[#64748B]">No communications match the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-[#E9EEF4] md:hidden">
          {visibleRecords.map((record) => (
            <article key={record.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#173F7A]">{record.id}</span>
                  <h3 className="mt-1 break-words text-sm font-bold">{record.subject}</h3>
                  <p className="mt-1 text-xs text-[#64748B]">{record.type} · {record.audience}</p>
                </div>
                <StatusBadge status={record.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
                <span>{record.channel}</span><span>{record.schemeName ?? 'No scheme'}</span><span>{localDate(record.createdAt)}</span>
              </div>
              <button type="button" onClick={() => setSelectedId(record.id)} className="mt-3 min-h-9 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">View details</button>
            </article>
          ))}
          {visibleRecords.length === 0 && <p className="p-8 text-center text-sm text-[#64748B]">No communications match the selected filters.</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE3EC] bg-[#FAFBFD] px-4 py-2.5 text-xs text-[#64748B]">
          <span>Showing {visibleRecords.length} of {records.length} demo communications</span>
          <span>External SMS/email service not connected.</span>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 bg-slate-950/35" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
          <aside role="dialog" aria-modal="true" aria-labelledby="communication-inspector-title" className="absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto border-l border-[#DCE3EC] bg-white shadow-xl sm:max-w-xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#DCE3EC] bg-white px-4 py-4 sm:px-6">
              <div className="min-w-0"><div className="text-xs font-semibold text-[#173F7A]">{selected.id} · DEMO COMMUNICATION</div><h2 id="communication-inspector-title" className="mt-1 break-words text-lg font-bold">{selected.subject}</h2><div className="mt-2"><StatusBadge status={selected.status} /></div></div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Close communication details" className="rounded p-1 text-[#64748B] hover:bg-[#F1F5F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><X size={20} /></button>
            </div>
            <div className="space-y-5 p-4 sm:p-6">
              <section>
                <h3 className="mb-3 text-sm font-bold">Communication details</h3>
                <InfoGrid items={[
                  ['Type', selected.type], ['Created by', selected.createdBy],
                  ['Created date', localDate(selected.createdAt)],
                  ['Scheduled date/time', localDate(selected.scheduledAt)],
                  ['Status', selected.status], ['Channel', selected.channel],
                ]} />
              </section>
              <section>
                <h3 className="mb-3 text-sm font-bold">Audience</h3>
                <InfoGrid items={[
                  ['Audience type', selected.audience],
                  ['Illustrative recipients', selected.recipientCount.toLocaleString('en-IN')],
                  ['Scheme', selected.schemeName ?? '—'],
                  ['Application', selected.applicationId ?? '—'],
                  ['Applicant', selected.applicantName ?? '—'],
                  ['State / category', [selected.state, selected.category].filter(Boolean).join(' · ') || '—'],
                ]} />
              </section>
              <section>
                <h3 className="mb-2 text-sm font-bold">Message preview</h3>
                <div className="border border-[#DCE3EC] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#334155]"><p className="mb-2 font-semibold text-[#172033]">{selected.subject}</p><p className="whitespace-pre-wrap">{selected.message}</p></div>
              </section>
              <section>
                <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-bold">Delivery summary</h3><span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">Illustrative demo statistics</span></div>
                <div className="grid grid-cols-2 gap-px border border-[#DCE3EC] bg-[#DCE3EC] sm:grid-cols-4">
                  {[
                    ['Total', selected.deliveryStats.totalRecipients],
                    ['Delivered', selected.deliveryStats.delivered],
                    ['Pending', selected.deliveryStats.pending],
                    ['Failed', selected.deliveryStats.failed],
                  ].map(([label, value]) => <div key={label} className="bg-white p-3"><div className="text-[11px] text-[#64748B]">{label}</div><div className="mt-1 text-lg font-bold tabular-nums">{Number(value).toLocaleString('en-IN')}</div></div>)}
                </div>
                <p className="mt-2 text-xs text-[#64748B]">Delivery rate: {deliveredPercentage(selected.deliveryStats)}%. External delivery is not connected.</p>
              </section>
              <section>
                <h3 className="mb-3 text-sm font-bold">Demo activity</h3>
                <ol className="space-y-3 border-l border-[#DCE3EC] pl-4">
                  {[...selected.activity].reverse().map((item) => (
                    <li key={item.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#2563A8] ring-1 ring-[#C9D4E2]" />
                      <div className="text-xs font-semibold">{item.action}<span className="ml-1 font-normal text-[#64748B]">· Demo</span></div>
                      <p className="mt-0.5 text-xs leading-5 text-[#64748B]">{item.details}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{localDate(item.timestamp)} · {item.actor}</p>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="border-t border-[#DCE3EC] pt-4">
                <h3 className="mb-3 text-sm font-bold">Communication actions</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'Draft' && <>
                    <ActionButton onClick={() => openEdit(selected)} icon={Edit3}>Edit</ActionButton>
                    <ActionButton onClick={() => { updateRecord(selected.id, (item) => { const total = recipientCount(item.audience, item.applicationId ?? '', item.schemeId ?? '', item.state ?? '', applications); return { ...item, status: 'Sent', updatedAt: new Date().toISOString(), recipientCount: total, deliveryStats: { totalRecipients: total, delivered: 0, pending: 0, failed: 0 }, activity: [...item.activity, newActivity('Send initiated', 'Demo send completed. External delivery is not connected in this prototype.')] }; }, 'Demo send completed. External delivery is not connected in this prototype.'); }} icon={Send} primary>Send demo</ActionButton>
                    <ActionButton onClick={() => cancelCommunication(selected)} icon={X} danger>Cancel</ActionButton>
                    <ActionButton onClick={() => deleteDraft(selected)} icon={Trash2} danger>Delete draft</ActionButton>
                  </>}
                  {selected.status === 'Scheduled' && <>
                    <ActionButton onClick={() => openEdit(selected)} icon={Edit3}>Edit</ActionButton>
                    <ActionButton onClick={() => cancelCommunication(selected)} icon={X} danger>Cancel</ActionButton>
                  </>}
                  {selected.status === 'Failed' && <>
                    <ActionButton onClick={() => openEdit(selected)} icon={Edit3}>Edit</ActionButton>
                    <ActionButton onClick={() => retryCommunication(selected)} icon={RefreshCw} primary>Retry demo</ActionButton>
                  </>}
                  {selected.status !== 'Cancelled' && <ActionButton onClick={() => duplicateCommunication(selected)} icon={Copy}>Duplicate</ActionButton>}
                  {selected.status === 'Cancelled' && <ActionButton onClick={() => duplicateCommunication(selected)} icon={Copy}>Duplicate as draft</ActionButton>}
                </div>
                <p className="mt-3 text-xs leading-5 text-[#64748B]">Demo communication only. No legal notice is issued and no real SMS or email is delivered. External SMS/email service not connected.</p>
              </section>
            </div>
          </aside>
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-950/40 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="communication-form-title" className="flex max-h-full w-full flex-col overflow-hidden bg-white shadow-xl sm:max-h-[92vh] sm:max-w-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#DCE3EC] px-4 py-4 sm:px-6">
              <div><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748B]">Demo communication</div><h2 id="communication-form-title" className="mt-1 text-lg font-bold">{editingId ? 'Edit communication' : 'New communication'}</h2></div>
              <button type="button" onClick={() => setEditorOpen(false)} aria-label="Close communication form" className="rounded p-1 text-[#64748B] hover:bg-[#F1F5F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><X size={20} /></button>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); persistForm(form.sendMode === 'schedule' ? 'schedule' : 'draft'); }} className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Communication type" required>
                    <select value={form.type} onChange={(event) => chooseType(event.target.value as CommunicationType)} required className={inputClass}>{COMMUNICATION_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
                  </FormField>
                  <FormField label="Message template">
                    <select defaultValue="" onChange={(event) => { if (event.target.value) applyTemplate(event.target.value); event.target.value = ''; }} className={inputClass}>
                      <option value="">Choose a template (optional)</option>
                      {templates.map((template) => <option key={template.name} value={template.name}>{template.name}</option>)}
                    </select>
                  </FormField>
                </div>
                <FormField label="Subject" required><input value={form.subject} onChange={(event) => updateForm('subject', event.target.value)} maxLength={160} required className={inputClass} /></FormField>
                <FormField label="Message" required><textarea value={form.message} onChange={(event) => updateForm('message', event.target.value)} rows={5} maxLength={5000} required className={`${inputClass} resize-y`} /><span className="text-[11px] text-[#64748B]">{form.message.length}/5000 characters</span></FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Audience" required>
                    <select value={form.audience} onChange={(event) => updateForm('audience', event.target.value as CommunicationAudience)} required className={inputClass}>{COMMUNICATION_AUDIENCES.map((audience) => <option key={audience}>{audience}</option>)}</select>
                  </FormField>
                  <FormField label="Channel" required>
                    <select value={form.channel} onChange={(event) => updateForm('channel', event.target.value as CommunicationChannel)} required className={inputClass}>{COMMUNICATION_CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}</select>
                  </FormField>
                </div>
                {audienceRequiresScheme && <FormField label="Related scheme" required>
                  <select value={form.schemeId} onChange={(event) => updateForm('schemeId', event.target.value)} required className={inputClass}><option value="">Select scheme</option>{schemes.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.name}</option>)}</select>
                </FormField>}
                {audienceRequiresApplication && <FormField label="Application ID" required>
                  <select value={form.applicationId} onChange={(event) => {
                    const app = applications.find((item) => item.applicationId === event.target.value);
                    const deficiency = deficiencies.find((item) => item.applicationId === event.target.value);
                    const relatedScheme = app?.schemeId ?? schemes.find((scheme) => scheme.name === deficiency?.scheme)?.id;
                    setForm((current) => ({ ...current, applicationId: event.target.value, schemeId: relatedScheme ?? current.schemeId }));
                    setFormError('');
                  }} required className={inputClass}>
                    <option value="">Select application</option>
                    {applications.map((app) => <option key={app.applicationId} value={app.applicationId}>{app.applicationId} — {app.applicantName}</option>)}
                    {deficiencies.filter((deficiency) => !applications.some((app) => app.applicationId === deficiency.applicationId)).map((deficiency) => <option key={deficiency.applicationId} value={deficiency.applicationId}>{deficiency.applicationId} — {deficiency.applicantName}</option>)}
                  </select>
                </FormField>}
                {form.audience === 'State / Region' && <FormField label="State / region" required>
                  <select value={form.state} onChange={(event) => updateForm('state', event.target.value)} required className={inputClass}><option value="">Select state</option>{stateOptions.map((state) => <option key={state}>{state}</option>)}</select>
                </FormField>}
                <div className="border-t border-[#DCE3EC] pt-4">
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold">Send or schedule</legend>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="inline-flex items-center gap-2"><input type="radio" name="sendMode" checked={form.sendMode === 'now'} onChange={() => updateForm('sendMode', 'now')} /> Send now (demo)</label>
                      <label className="inline-flex items-center gap-2"><input type="radio" name="sendMode" checked={form.sendMode === 'schedule'} onChange={() => updateForm('sendMode', 'schedule')} /> Schedule (demo)</label>
                    </div>
                  </fieldset>
                  {form.sendMode === 'schedule' && <FormField label="Scheduled date and time" required><input type="datetime-local" value={form.scheduledAt} onChange={(event) => updateForm('scheduledAt', event.target.value)} required className={inputClass} /></FormField>}
                </div>
                <p className="border-l-2 border-[#B7791F] bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">Demo communication only. No real SMS or email will be sent. Scheduled items are stored locally; external delivery service is not connected.</p>
                {formError && <p role="alert" className="flex items-center gap-2 text-sm font-medium text-[#C2414B]"><CircleAlert size={16} />{formError}</p>}
              </div>
              <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-[#DCE3EC] bg-white px-4 py-3 sm:px-6">
                <button type="button" onClick={() => setEditorOpen(false)} className="min-h-10 border border-[#C9D4E2] px-4 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Close</button>
                <button type="button" onClick={() => persistForm('draft')} className="min-h-10 border border-[#173F7A] px-4 text-sm font-semibold text-[#173F7A] hover:bg-[#F2F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Save Draft</button>
                <button type="button" onClick={() => persistForm(form.sendMode === 'schedule' ? 'schedule' : 'send')} className="inline-flex min-h-10 items-center gap-2 bg-[#173F7A] px-4 text-sm font-semibold text-white hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8]">
                  {form.sendMode === 'schedule' ? <><CalendarClock size={15} /> Schedule</> : <><Send size={15} /> Send demo</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

const inputClass = 'mt-1 min-h-10 w-full border border-[#C9D4E2] bg-white px-3 py-2 text-sm text-[#172033] outline-none focus:border-[#2563A8] focus:ring-1 focus:ring-[#2563A8]';

function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block text-xs font-semibold text-[#334155]">{label}{required && <span className="ml-1 text-[#C2414B]" aria-label="required">*</span>}{children}</label>;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  renderOption = (option) => option,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  renderOption?: (option: string) => string;
}) {
  return (
    <label className="relative">
      <span className="sr-only">Filter by {label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full appearance-none border border-[#DCE3EC] bg-white py-1 pl-2.5 pr-8 text-xs text-[#334155] outline-none focus:border-[#2563A8] focus:ring-1 focus:ring-[#2563A8]">
        {options.map((option) => <option key={option} value={option}>{renderOption(option)}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
    </label>
  );
}

function StatusBadge({ status }: { status: CommunicationStatus }) {
  return <span className={`inline-flex whitespace-nowrap px-2 py-1 text-[11px] font-semibold ${statusStyles[status]}`}>{status}</span>;
}

function InfoGrid({ items }: { items: [string, string][] }) {
  return <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[11px] font-medium text-[#64748B]">{label}</dt><dd className="mt-0.5 break-words text-xs font-semibold text-[#172033]">{value}</dd></div>)}</dl>;
}

function ActionButton({
  children,
  onClick,
  icon: Icon,
  primary = false,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  icon: typeof Edit3;
  primary?: boolean;
  danger?: boolean;
}) {
  const style = primary
    ? 'border-[#173F7A] bg-[#173F7A] text-white hover:bg-[#123363]'
    : danger
      ? 'border-rose-200 text-rose-800 hover:bg-rose-50'
      : 'border-[#C9D4E2] text-[#173F7A] hover:bg-[#F6F8FB]';
  return <button type="button" onClick={onClick} className={`inline-flex min-h-9 items-center gap-1.5 border px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] ${style}`}><Icon size={14} aria-hidden="true" />{children}</button>;
}
