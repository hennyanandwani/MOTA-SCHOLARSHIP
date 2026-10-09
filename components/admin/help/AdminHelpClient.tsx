'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  Info,
  LifeBuoy,
  Search,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  ADMIN_AUDIT_STORAGE_KEY,
  createInitialAuditEvents,
  isAdminAuditEventList,
  type AdminAuditEvent,
} from '@/lib/adminAuditData';
import type { AdminApplicationRecord } from '@/lib/adminData';
import {
  ADMIN_SUPPORT_CATEGORIES,
  ADMIN_SUPPORT_MODULES,
  ADMIN_SUPPORT_STORAGE_KEY,
  isAdminSupportRequestList,
  type AdminSupportCategory,
  type AdminSupportModule,
  type AdminSupportPriority,
  type AdminSupportRequest,
} from '@/lib/adminSupportData';

type Props = { applications: AdminApplicationRecord[] };
type HelpCategory = { id: string; label: string; route: string };
type FaqItem = { id: string; categoryId: string; category: string; question: string; answer: string };
type ModuleGuideItem = { id: string; categoryId: string; name: string; purpose: string; actions: string[]; route: string };
type InfoItem = { id: string; categoryId: string; title: string; body: string };
type RequestForm = {
  category: AdminSupportCategory;
  module: AdminSupportModule;
  subject: string;
  description: string;
  priority: AdminSupportPriority;
  referenceId: string;
};
type RequestErrors = Partial<Record<keyof RequestForm, string>>;

const helpCategories: HelpCategory[] = [
  { id: 'applications', label: 'Applications', route: '/admin/applications' },
  { id: 'verification', label: 'Verification', route: '/admin/verification' },
  { id: 'deficiencies', label: 'Deficiencies', route: '/admin/deficiencies' },
  { id: 'screening', label: 'Screening', route: '/admin/screening' },
  { id: 'selection', label: 'Selection & Sanction', route: '/admin/selection' },
  { id: 'schemes', label: 'Schemes', route: '/admin/schemes' },
  { id: 'rules', label: 'Rule Configuration', route: '/admin/rules' },
  { id: 'communications', label: 'Communications', route: '/admin/communications' },
  { id: 'analytics', label: 'Analytics & Reports', route: '/admin/analytics' },
  { id: 'audit', label: 'Audit Logs', route: '/admin/audit' },
  { id: 'account', label: 'Profile & Settings', route: '/admin/profile' },
];

const moduleGuide: ModuleGuideItem[] = [
  { id: 'overview', categoryId: 'overview', name: 'Overview', purpose: 'Monitor overall scholarship workflow and pending work.', actions: ['Review operational indicators', 'Open priority queues'], route: '/admin' },
  { id: 'applications', categoryId: 'applications', name: 'Applications', purpose: 'Search, filter, review, and manage application records.', actions: ['Search by application and applicant', 'Inspect workflow and submitted details'], route: '/admin/applications' },
  { id: 'verification', categoryId: 'verification', name: 'Verification', purpose: 'Review documents and record official verification outcomes.', actions: ['Inspect document evidence', 'Record authorized verification outcome'], route: '/admin/verification' },
  { id: 'deficiencies', categoryId: 'deficiencies', name: 'Deficiencies', purpose: 'Manage missing, unclear, or incorrect information and correction requests.', actions: ['Review deficiency records', 'Track applicant responses and resolution'], route: '/admin/deficiencies' },
  { id: 'screening', categoryId: 'screening', name: 'Screening', purpose: 'Review eligibility criteria and cases flagged for official review.', actions: ['Review preliminary matches and exceptions', 'Record official review notes'], route: '/admin/screening' },
  { id: 'selection', categoryId: 'selection', name: 'Selection & Sanction', purpose: 'Manage ranking, recommendations, selection, approval, and sanction readiness.', actions: ['Review merit ranking and recommendations', 'Track approval and sanction workflow'], route: '/admin/selection' },
  { id: 'schemes', categoryId: 'schemes', name: 'Schemes', purpose: 'Manage scholarship schemes, application windows, capacity, and benefits.', actions: ['Review scheme configuration', 'Maintain dates, capacity, and benefit details'], route: '/admin/schemes' },
  { id: 'rules', categoryId: 'rules', name: 'Rule Configuration', purpose: 'Configure, validate, and preview illustrative eligibility rules.', actions: ['Create or update a rule', 'Run a frontend rule evaluation preview'], route: '/admin/rules' },
  { id: 'communications', categoryId: 'communications', name: 'Communications', purpose: 'Manage applicant notifications and illustrative Ministry communications.', actions: ['Prepare, schedule, or demo-send a message', 'Review communication status'], route: '/admin/communications' },
  { id: 'analytics', categoryId: 'analytics', name: 'Analytics & Reports', purpose: 'Monitor processing performance and generate filtered demo reports.', actions: ['Explore trends and workflow measures', 'Preview and export reports'], route: '/admin/analytics' },
  { id: 'audit', categoryId: 'audit', name: 'Audit Logs', purpose: 'Track administrative actions, workflow changes, and illustrative security events.', actions: ['Filter and inspect event history', 'Review official override reasons'], route: '/admin/audit' },
  { id: 'account', categoryId: 'account', name: 'Profile & Settings', purpose: 'Manage local demo account details and administrator preferences.', actions: ['Edit demo profile information', 'Set preferences and review account guidance'], route: '/admin/profile' },
];

const faqItems: FaqItem[] = [
  { id: 'apps-search', categoryId: 'applications', category: 'Applications', question: 'How do I search for an application?', answer: 'Open the Applications registry and search using an application reference or applicant name. Combine the search with status, scheme, state, or other available filters to narrow the displayed records.' },
  { id: 'apps-details', categoryId: 'applications', category: 'Applications', question: 'How do I view application details?', answer: 'Select an application row or card to open its inspector. The inspector presents available application information, workflow status, and related records without requiring you to leave the registry.' },
  { id: 'apps-status', categoryId: 'applications', category: 'Applications', question: 'How do I filter applications by status?', answer: 'Use the status filter above the Applications registry. The visible results update to match the selected status; reset or change the filter to view another group.' },
  { id: 'verify-process', categoryId: 'verification', category: 'Verification', question: 'How does document verification work?', answer: 'Open the Verification Queue, inspect the document and any available extracted fields or checks, then record the authorized officer outcome. A machine-generated comparison is supporting information, not a verification decision.' },
  { id: 'verify-ai', categoryId: 'verification', category: 'Verification', question: 'What does AI-assisted verification mean?', answer: 'AI-assisted verification can extract document information or identify possible mismatches for an officer to review. Outputs may be incomplete or incorrect and should be checked against source evidence.' },
  { id: 'verify-decision', categoryId: 'verification', category: 'Verification', question: 'How do I record an official verification decision?', answer: 'Open a verification record, inspect the relevant evidence, add the required review note, and use the outcome control provided by that workflow. Only an authorized official should record the decision.' },
  { id: 'def-raise', categoryId: 'deficiencies', category: 'Deficiencies', question: 'How do I raise a deficiency?', answer: 'Open a relevant application in the Deficiencies module, identify the missing, unclear, or inconsistent item, and prepare a concise correction request using the available workflow.' },
  { id: 'def-correction', categoryId: 'deficiencies', category: 'Deficiencies', question: 'How does the correction process work?', answer: 'A deficiency notice identifies information for the applicant to correct. The record can show response and review stages; check the related application before deciding whether the response resolves the issue.' },
  { id: 'def-resolve', categoryId: 'deficiencies', category: 'Deficiencies', question: 'How do I resolve a deficiency?', answer: 'Review the submitted response and supporting material, then record the appropriate officer outcome in the deficiency inspector. Resolution should reflect the actual evidence reviewed.' },
  { id: 'screen-preliminary', categoryId: 'screening', category: 'Screening', question: 'What does Preliminary Match mean?', answer: 'A Preliminary Match means configured criteria appear to match the available demonstration data. It is an advisory screening result and does not establish final eligibility.' },
  { id: 'screen-exception', categoryId: 'screening', category: 'Screening', question: 'What is a Borderline / Exception case?', answer: 'A borderline or exception case has missing, uncertain, conflicting, or near-threshold information that should be assessed by an authorized official rather than treated as an automatic outcome.' },
  { id: 'screen-final', categoryId: 'screening', category: 'Screening', question: 'Who makes the final eligibility decision?', answer: 'Authorized Ministry officials make final eligibility and verification decisions. AI-assisted assessment, rules previews, and preliminary matching do not approve, select, or reject applicants.' },
  { id: 'selection-rank', categoryId: 'selection', category: 'Selection & Sanction', question: 'How are applicants ranked?', answer: 'The Selection module presents configured merit factors and illustrative scores to support committee review. Confirm the scheme criteria and underlying evidence before recording any official action.' },
  { id: 'selection-status', categoryId: 'selection', category: 'Selection & Sanction', question: 'What is the difference between Recommended and Selected?', answer: 'Recommended indicates a proposal for official consideration. Selected records a status within the workflow but may still require approval and sanction steps; it should not be interpreted as payment or final authorization.' },
  { id: 'selection-sanction', categoryId: 'selection', category: 'Selection & Sanction', question: 'How does the sanction workflow work?', answer: 'Review the selection and approval status, confirm required authorization, then follow the available sanction-readiness and submission stages. The prototype does not issue a real sanction or trigger a payment.' },
  { id: 'rules-create', categoryId: 'rules', category: 'Rule Configuration', question: 'How do I create or modify an eligibility rule?', answer: 'Open Rule Configuration, choose Create Rule or edit an existing rule, provide its scheme, category, field, operator, value, and evaluation behavior, then save the configuration. Check data type and validation before saving.' },
  { id: 'rules-test', categoryId: 'rules', category: 'Rule Configuration', question: 'How do I test a rule?', answer: 'Use Test Rule in the rule inspector to enter sample applicant values and preview the configured comparison. This frontend demonstration is not an official eligibility decision.' },
  { id: 'rules-missing', categoryId: 'rules', category: 'Rule Configuration', question: 'What happens when required applicant data is missing?', answer: 'The rule’s configured missing-data behavior indicates whether to request clarification, flag for official review, or fail the rule preview. Officials must review context; a missing value should not be silently treated as a verified fact.' },
  { id: 'com-create', categoryId: 'communications', category: 'Communications', question: 'How do I create a communication?', answer: 'Open Communications, select New Communication, choose the type and audience, and complete the required message and references. Review the preview before saving or scheduling.' },
  { id: 'com-schedule', categoryId: 'communications', category: 'Communications', question: 'Can I schedule a communication?', answer: 'The prototype can record a schedule locally and show a Scheduled demo state. It does not connect to an external delivery service or guarantee that a message will be sent.' },
  { id: 'com-delivery', categoryId: 'communications', category: 'Communications', question: 'Are SMS/email messages actually sent in this prototype?', answer: 'No. External SMS/email delivery is not connected. Any delivery status shown is illustrative and a demo send does not contact a real messaging service.' },
  { id: 'audit-record', categoryId: 'audit', category: 'Audit Logs', question: 'What information is recorded in Audit Logs?', answer: 'The Audit Logs module presents illustrative event identifiers, timestamps, user roles, actions, module references, severity, before/after values, and demo security metadata where applicable.' },
  { id: 'audit-investigate', categoryId: 'audit', category: 'Audit Logs', question: 'How do I investigate an administrative action?', answer: 'Search or filter by event ID, officer, action, module, severity, reference, or date. Open an event to review its reference, state change, activity timeline, and any recorded official reason. Demo records are not production security evidence.' },
  { id: 'account-settings', categoryId: 'account', category: 'Profile & Settings', question: 'Where do I change my profile or administrator preferences?', answer: 'Use Profile to edit demonstration account details and Settings to manage local preferences. These values are stored in this browser and are not synchronized with a Ministry identity service.' },
];

const troubleshooting: InfoItem[] = [
  { id: 'trouble-data', categoryId: 'applications', title: 'Data is not appearing', body: 'Refresh the page and verify active search terms, date ranges, status, scheme, and other filters.' },
  { id: 'trouble-external', categoryId: 'communications', title: 'A button does not perform an external action', body: 'Some prototype integrations are intentionally local/demo only. Check the on-screen notice; no external system is contacted unless explicitly integrated.' },
  { id: 'trouble-sms', categoryId: 'communications', title: 'SMS/email delivery is not confirmed', body: 'External messaging services are not connected unless explicitly integrated. Demo statuses are illustrative, not delivery receipts.' },
  { id: 'trouble-settings', categoryId: 'account', title: 'Settings reset after browser data is cleared', body: 'Prototype preferences are stored locally in the browser. Clearing site data or using another browser removes access to those local values.' },
  { id: 'trouble-stage', categoryId: 'selection', title: 'A workflow decision is unavailable', body: 'Check whether the application has completed the required previous stage and whether the current record status permits the action.' },
];

const statusGuide: InfoItem[] = [
  { id: 'status-pending', categoryId: 'applications', title: 'Pending Review', body: 'Awaiting an officer’s review or assignment.' },
  { id: 'status-verification', categoryId: 'verification', title: 'Under Verification', body: 'Submitted documents are being checked by the verification workflow.' },
  { id: 'status-correction', categoryId: 'deficiencies', title: 'Needs Correction', body: 'Additional or corrected information has been requested.' },
  { id: 'status-match', categoryId: 'screening', title: 'Preliminary Match', body: 'Available data appears to meet configured criteria; official review remains necessary.' },
  { id: 'status-missing', categoryId: 'screening', title: 'Missing Information', body: 'Required information is not available for a complete assessment.' },
  { id: 'status-borderline', categoryId: 'screening', title: 'Borderline / Exception', body: 'Case needs contextual review by an authorized official.' },
  { id: 'status-recommended', categoryId: 'selection', title: 'Recommended', body: 'Proposed for consideration; not a final selection decision.' },
  { id: 'status-waitlisted', categoryId: 'selection', title: 'Waitlisted', body: 'Held for consideration subject to scheme rules and available capacity.' },
  { id: 'status-selected', categoryId: 'selection', title: 'Selected', body: 'Recorded at selection stage; approval and sanction steps may remain.' },
  { id: 'status-approval', categoryId: 'selection', title: 'Approval Pending', body: 'Awaiting the required official approval.' },
  { id: 'status-sanction', categoryId: 'selection', title: 'Sanction Ready', body: 'Marked as ready for the next authorized sanction workflow step.' },
  { id: 'status-complete', categoryId: 'applications', title: 'Completed', body: 'The displayed workflow has reached its configured completion state.' },
];

const workflowSteps = [
  { title: 'Review Applications', description: 'Open the Applications registry and inspect the submitted record.', route: '/admin/applications' },
  { title: 'Verify Documents', description: 'Review submitted evidence and verification status.', route: '/admin/verification' },
  { title: 'Resolve Deficiencies', description: 'Request corrections when information is incomplete or unclear.', route: '/admin/deficiencies' },
  { title: 'Screen Applications', description: 'Review criteria matches and cases requiring official review.', route: '/admin/screening' },
  { title: 'Manage Selection', description: 'Review ranking and official selection workflow.', route: '/admin/selection' },
  { title: 'Complete Sanction Process', description: 'Review approval and illustrative sanction readiness.', route: '/admin/selection' },
  { title: 'Monitor Analytics', description: 'Track processing performance and filtered reports.', route: '/admin/analytics' },
];

const initialRequest: RequestForm = {
  category: 'Technical Issue',
  module: 'System',
  subject: '',
  description: '',
  priority: 'Normal',
  referenceId: '',
};

function searchable(item: { title?: string; question?: string; answer?: string; body?: string; name?: string; purpose?: string; actions?: string[] }): string {
  return [
    item.title,
    item.question,
    item.answer,
    item.body,
    item.name,
    item.purpose,
    ...(item.actions ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function matchesQuery(value: string, query: string): boolean {
  return !query || value.toLowerCase().includes(query);
}

export function AdminHelpClient({ applications }: Props) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([]);
  const [supportRequests, setSupportRequests] = useState<AdminSupportRequest[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<RequestForm>(initialRequest);
  const [errors, setErrors] = useState<RequestErrors>({});
  const [feedback, setFeedback] = useState('');
  const [storageError, setStorageError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const applicationsForAudit = useMemo(() => applications, [applications]);
  const defaultAuditEvents = useMemo(() => createInitialAuditEvents({
    applications: applicationsForAudit,
    schemes: [],
    rules: [],
  }), [applicationsForAudit]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ADMIN_SUPPORT_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isAdminSupportRequestList(parsed)) setSupportRequests(parsed);
        else setStorageError('Saved support requests are invalid. New requests can still be recorded.');
      }
    } catch {
      setStorageError('Saved support requests are unavailable in this browser.');
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!formOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeForm();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [formOpen]);

  const normalizedQuery = query.trim().toLowerCase();
  const matchesCategory = (categoryId: string) => categoryFilter === 'all' || categoryFilter === categoryId;

  const filteredFaqs = faqItems.filter((faq) =>
    matchesCategory(faq.categoryId) &&
    matchesQuery(searchable({ question: faq.question, answer: faq.answer, title: faq.category }), normalizedQuery),
  );
  const filteredModules = moduleGuide.filter((item) =>
    matchesCategory(item.categoryId) && matchesQuery(searchable(item), normalizedQuery),
  );
  const filteredTroubleshooting = troubleshooting.filter((item) =>
    matchesCategory(item.categoryId) && matchesQuery(searchable(item), normalizedQuery),
  );
  const filteredStatuses = statusGuide.filter((item) =>
    matchesCategory(item.categoryId) && matchesQuery(searchable(item), normalizedQuery),
  );
  const isEmpty = !filteredFaqs.length && !filteredModules.length && !filteredTroubleshooting.length && !filteredStatuses.length;

  function selectCategory(categoryId: string) {
    setCategoryFilter(categoryId);
    document.getElementById('help-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeForm() {
    setFormOpen(false);
    setErrors({});
  }

  function requestErrors(): RequestErrors {
    const next: RequestErrors = {};
    if (!form.subject.trim() || form.subject.trim().length < 3) next.subject = 'Enter a subject with at least 3 characters.';
    if (!form.description.trim() || form.description.trim().length < 10) next.description = 'Describe the issue in at least 10 characters.';
    if (form.referenceId.trim().length > 80) next.referenceId = 'Reference ID must be 80 characters or fewer.';
    return next;
  }

  function recordAuditEvent(request: AdminSupportRequest): boolean {
    try {
      const raw = window.localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      const current = isAdminAuditEventList(parsed) ? parsed : defaultAuditEvents;
      const timestamp = request.createdAt;
      const auditEvent: AdminAuditEvent = {
        id: `AUD-${new Date().getFullYear()}-SUP-${Date.now().toString().slice(-6)}`,
        timestamp,
        userId: 'DEMO-ADMIN-01',
        userName: 'MoTA Administrator',
        role: 'Administrator',
        action: 'Support Request Recorded',
        actionType: 'Workflow',
        module: 'System',
        referenceId: request.id,
        previousState: 'No support request',
        newState: `Demo request submitted · ${request.module}`,
        severity: request.priority === 'Urgent' || request.priority === 'High' ? 'High' : 'Info',
        isDemo: true,
        activity: [{
          id: `${request.id}-audit`,
          timestamp,
          description: 'A support request was recorded in demo mode; no external helpdesk was contacted.',
        }],
      };
      window.localStorage.setItem(ADMIN_AUDIT_STORAGE_KEY, JSON.stringify([auditEvent, ...current]));
      return true;
    } catch {
      return false;
    }
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = requestErrors();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const timestamp = new Date().toISOString();
    const nextRequest: AdminSupportRequest = {
      id: `SUP-DEMO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      category: form.category,
      module: form.module,
      subject: form.subject.trim(),
      description: form.description.trim(),
      priority: form.priority,
      ...(form.referenceId.trim() ? { referenceId: form.referenceId.trim() } : {}),
      status: 'Submitted',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const nextRequests = [nextRequest, ...supportRequests];
    try {
      window.localStorage.setItem(ADMIN_SUPPORT_STORAGE_KEY, JSON.stringify(nextRequests));
    } catch {
      setStorageError('The support request could not be saved in this browser. Please check available storage and retry.');
      return;
    }
    setSupportRequests(nextRequests);
    const auditSaved = recordAuditEvent(nextRequest);
    setFeedback(auditSaved
      ? `Support request recorded in demo mode. Reference: ${nextRequest.id}. No external support ticket was created.`
      : `Support request ${nextRequest.id} was saved locally, but its audit entry could not be stored.`);
    if (!auditSaved) setStorageError('Audit event storage failed; the support request is saved locally.');
    setForm(initialRequest);
    closeForm();
    window.setTimeout(() => document.getElementById('support-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }

  function toggleFaq(id: string) {
    setExpandedFaqs((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  const searchableResultCount = filteredFaqs.length + filteredModules.length + filteredTroubleshooting.length + filteredStatuses.length;

  return (
    <div className="space-y-5 text-[#172033]">
      <header className="border-b border-[#DCE3EC] pb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748B]">Administration / Help</span>
          <span className="border border-[#D6E1EF] bg-[#EEF4FB] px-2 py-0.5 text-[10px] font-bold tracking-[0.09em] text-[#173F7A]">DEMO SUPPORT CENTER</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#172033] sm:text-[28px]">Help & Support</h2>
        <p className="mt-1 max-w-3xl text-sm text-[#64748B]">Find guidance, system documentation, troubleshooting information, and support resources for Ministry administrators.</p>
        <label htmlFor="admin-help-search" className="relative mt-4 block max-w-3xl">
          <span className="sr-only">Search help articles, modules, workflows, or common issues</span>
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
          <input
            id="admin-help-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search help articles, modules, workflows, or common issues..."
            className="h-12 w-full border border-[#C9D4E2] bg-white pl-11 pr-4 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
          />
        </label>
        {(normalizedQuery || categoryFilter !== 'all') && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#64748B]" aria-live="polite">
            <span>{searchableResultCount} matching help entries</span>
            <button type="button" onClick={() => { setQuery(''); setCategoryFilter('all'); }} className="font-semibold text-[#173F7A] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Clear search and category</button>
          </div>
        )}
      </header>

      {feedback && (
        <div id="support-feedback" role="status" className="flex items-start justify-between gap-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <span>{feedback}</span>
          <button type="button" aria-label="Dismiss support confirmation" onClick={() => setFeedback('')} className="rounded p-0.5 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><X size={16} aria-hidden="true" /></button>
        </div>
      )}
      {storageError && <p role="alert" className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{storageError}</p>}

      <section aria-labelledby="quick-categories-heading">
        <div className="mb-3">
          <h3 id="quick-categories-heading" className="text-sm font-bold">Quick Help Categories</h3>
          <p className="mt-0.5 text-xs text-[#64748B]">Select a category to filter FAQs, modules, status guidance, and troubleshooting.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {helpCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={categoryFilter === category.id}
              onClick={() => selectCategory(categoryFilter === category.id ? 'all' : category.id)}
              className={`flex min-h-10 items-center justify-between gap-2 border px-3 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] ${categoryFilter === category.id ? 'border-[#173F7A] bg-[#EEF4FB] text-[#173F7A]' : 'border-[#DCE3EC] bg-white text-[#475569] hover:bg-[#F8FAFD]'}`}
            >
              <span>{category.label}</span>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      {isEmpty ? (
        <section id="help-content" aria-live="polite" className="border border-dashed border-[#C9D4E2] bg-white px-4 py-10 text-center">
          <CircleHelp size={24} className="mx-auto text-[#64748B]" aria-hidden="true" />
          <h3 className="mt-2 text-sm font-bold text-[#172033]">No help articles found</h3>
          <p className="mt-1 text-xs text-[#64748B]">Try a different keyword or browse the categories above.</p>
        </section>
      ) : (
        <>
          <section id="help-content" className="grid scroll-mt-24 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            {filteredFaqs.length > 0 && (
              <section aria-labelledby="admin-faq-heading" className="min-w-0 border border-[#DCE3EC] bg-white">
                <div className="border-b border-[#DCE3EC] px-4 py-3">
                  <h3 id="admin-faq-heading" className="text-sm font-bold">Frequently Asked Questions</h3>
                  <p className="mt-0.5 text-xs text-[#64748B]">Operational guidance for common Admin workflows.</p>
                </div>
                <div className="divide-y divide-[#E8EDF3]">
                  {filteredFaqs.map((faq) => {
                    const expanded = expandedFaqs.includes(faq.id);
                    const panelId = `admin-faq-answer-${faq.id}`;
                    const buttonId = `admin-faq-button-${faq.id}`;
                    return (
                      <article key={faq.id}>
                        <h4>
                          <button
                            id={buttonId}
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={panelId}
                            onClick={() => toggleFaq(faq.id)}
                            className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#F8FAFD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563A8]"
                          >
                            <span className="min-w-0">
                              <span className="block text-[10px] font-bold uppercase tracking-wide text-[#64748B]">{faq.category}</span>
                              <span className="mt-0.5 block text-xs font-semibold leading-5 text-[#172033]">{faq.question}</span>
                            </span>
                            <ChevronDown size={16} className={`shrink-0 text-[#64748B] transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                          </button>
                        </h4>
                        {expanded && (
                          <div id={panelId} role="region" aria-labelledby={buttonId} className="border-t border-[#EEF1F5] px-4 py-3 text-xs leading-5 text-[#475569]">
                            <p>{faq.answer}</p>
                            {helpCategories.find((item) => item.label === faq.category) && (
                              <Link href={helpCategories.find((item) => item.label === faq.category)!.route} className="mt-2 inline-flex items-center gap-1 font-semibold text-[#173F7A] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                                Open {faq.category} <ExternalLink size={12} aria-hidden="true" />
                              </Link>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {filteredModules.length > 0 && (
              <section aria-labelledby="module-guide-heading" className="min-w-0 border border-[#DCE3EC] bg-white">
                <div className="border-b border-[#DCE3EC] px-4 py-3">
                  <h3 id="module-guide-heading" className="text-sm font-bold">Module Guide</h3>
                  <p className="mt-0.5 text-xs text-[#64748B]">Purpose, common actions, and a direct route to each module.</p>
                </div>
                <div className="divide-y divide-[#E8EDF3]">
                  {filteredModules.map((module) => (
                    <article key={module.id} className="p-3">
                      <h4 className="text-xs font-bold text-[#172033]">{module.name}</h4>
                      <p className="mt-1 text-[11px] leading-4 text-[#64748B]">{module.purpose}</p>
                      <ul className="mt-2 space-y-1">
                        {module.actions.map((action) => <li key={action} className="flex gap-2 text-[10px] leading-4 text-[#475569]"><span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#6483A8]" />{action}</li>)}
                      </ul>
                      <Link href={module.route} className="mt-2 inline-flex min-h-8 items-center gap-1.5 border border-[#C9D4E2] px-2.5 text-[11px] font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                        Open Module <ArrowRight size={12} aria-hidden="true" />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </section>

          {filteredModules.length > 0 && (
            <section aria-labelledby="getting-started-heading" className="border border-[#DCE3EC] bg-white">
              <div className="border-b border-[#DCE3EC] px-4 py-3">
                <h3 id="getting-started-heading" className="text-sm font-bold">Getting Started: Administrator Workflow</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">A concise path through the main review stages; follow the applicable scheme process.</p>
              </div>
              <ol className="grid divide-y divide-[#E8EDF3] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
                {workflowSteps.map((step, index) => (
                  <li key={step.title} className="flex min-w-0 gap-3 p-3 sm:border-b sm:border-r sm:border-[#E8EDF3] lg:[&:nth-child(4n)]:border-r-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#C9D8EB] bg-[#EEF4FB] text-xs font-bold text-[#173F7A]">{index + 1}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#172033]">{step.title}</h4>
                      <p className="mt-1 text-[10px] leading-4 text-[#64748B]">{step.description}</p>
                      <Link href={step.route} className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#173F7A] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Open step <ArrowRight size={11} aria-hidden="true" /></Link>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <section aria-labelledby="ai-guidance-heading" className="border border-[#D6E1EF] bg-[#F8FAFD]">
        <div className="flex items-start gap-3 p-4">
          <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />
          <div>
            <h3 id="ai-guidance-heading" className="text-sm font-bold">AI-Assisted Review</h3>
            <p className="mt-1 text-xs leading-5 text-[#475569]">AI-assisted tools may support document extraction, preliminary matching, risk/flag identification, data comparison, and screening assistance. These outputs can be incomplete or incorrect and require human review.</p>
            <p className="mt-2 border-l-2 border-[#6483A8] pl-3 text-xs font-semibold leading-5 text-[#334155]">AI outputs are advisory and intended to assist authorized officials. Final eligibility, verification, selection, and approval decisions remain with authorized Ministry officials.</p>
          </div>
        </div>
      </section>

      {filteredStatuses.length > 0 && (
        <section aria-labelledby="status-guide-heading" className="border border-[#DCE3EC] bg-white">
          <div className="border-b border-[#DCE3EC] px-4 py-3">
            <h3 id="status-guide-heading" className="text-sm font-bold">Status Guide</h3>
            <p className="mt-0.5 text-xs text-[#64748B]">Common workflow terms used across Admin modules.</p>
          </div>
          <dl className="grid gap-px bg-[#E8EDF3] sm:grid-cols-2 lg:grid-cols-3">
            {filteredStatuses.map((status) => (
              <div key={status.id} className="bg-white p-3">
                <dt className="text-xs font-bold text-[#172033]">{status.title}</dt>
                <dd className="mt-1 text-[11px] leading-4 text-[#64748B]">{status.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {filteredTroubleshooting.length > 0 && (
        <section aria-labelledby="troubleshooting-heading" className="border border-[#DCE3EC] bg-white">
          <div className="border-b border-[#DCE3EC] px-4 py-3">
            <h3 id="troubleshooting-heading" className="text-sm font-bold">Troubleshooting</h3>
          </div>
          <div className="divide-y divide-[#E8EDF3]">
            {filteredTroubleshooting.map((item) => (
              <div key={item.id} className="grid gap-1 p-3 sm:grid-cols-[minmax(200px,0.4fr)_1fr] sm:gap-4">
                <h4 className="text-xs font-semibold text-[#172033]">{item.title}</h4>
                <p className="text-xs leading-5 text-[#475569]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="contact-support-heading" className="border border-[#DCE3EC] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#DCE3EC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <LifeBuoy size={19} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />
            <div>
              <h3 id="contact-support-heading" className="text-sm font-bold">Contact Support</h3>
              <p className="mt-0.5 text-xs text-[#64748B]">Ministry Administrator Support · demo contact information</p>
            </div>
          </div>
          <button type="button" onClick={() => { setForm(initialRequest); setFormOpen(true); }} className="inline-flex min-h-9 items-center justify-center gap-2 bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8]">
            <Send size={14} aria-hidden="true" /> Raise Support Request
          </button>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <ContactValue label="Support Email" value="admin.support@example.gov.in (demo)" />
          <ContactValue label="Support Desk" value="+91 00000 00000 (demo)" />
          <ContactValue label="Working Hours" value="Monday–Friday, 09:30–17:30 IST (demo)" />
        </div>
        <p className="mx-4 mb-4 border-l-2 border-[#E4C98F] pl-3 text-[11px] leading-5 text-[#79520F]">Not connected in this prototype. Demo contact details are fictional; requests are stored locally and no support staff or external ticket system receives them.</p>
        {supportRequests.length > 0 && (
          <div className="border-t border-[#DCE3EC] px-4 py-3">
            <h4 className="text-xs font-bold text-[#172033]">Locally recorded demo requests ({supportRequests.length})</h4>
            <ul className="mt-2 divide-y divide-[#E8EDF3]">
              {supportRequests.slice(0, 4).map((request) => (
                <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                  <span className="min-w-0"><span className="font-mono text-[10px] text-[#64748B]">{request.id}</span><span className="ml-2 font-semibold text-[#172033]">{request.subject}</span></span>
                  <span className="border border-[#DCE3EC] bg-[#F8FAFD] px-2 py-1 text-[10px] font-semibold text-[#475569]">{request.status} · {request.priority}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <nav aria-label="Related administrator resources" className="border-t border-[#DCE3EC] pt-4">
        <h3 className="mb-2 text-xs font-bold text-[#475569]">Related Resources</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {[
            ['Profile', '/admin/profile'],
            ['Settings', '/admin/settings'],
            ['Audit Logs', '/admin/audit'],
            ['Applications', '/admin/applications'],
            ['Verification', '/admin/verification'],
            ['Deficiencies', '/admin/deficiencies'],
            ['Screening', '/admin/screening'],
            ['Selection', '/admin/selection'],
            ['Schemes', '/admin/schemes'],
            ['Rules', '/admin/rules'],
            ['Communications', '/admin/communications'],
            ['Analytics', '/admin/analytics'],
          ].map(([label, route]) => <Link key={route} href={route} className="text-[11px] font-semibold text-[#173F7A] underline decoration-[#A9BED8] underline-offset-2 hover:text-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">{label}</Link>)}
        </div>
      </nav>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/40 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="support-request-title" className="max-h-[95dvh] w-full overflow-y-auto border border-[#DCE3EC] bg-white shadow-xl sm:max-w-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#DCE3EC] bg-white px-4 py-4 sm:px-5">
              <div>
                <h3 id="support-request-title" className="text-lg font-bold text-[#172033]">Raise Support Request</h3>
                <p className="mt-1 text-xs text-[#64748B]">Demo request form. This will not contact an external support service.</p>
              </div>
              <button type="button" onClick={closeForm} aria-label="Close support request form" className="rounded p-2 text-[#64748B] hover:bg-[#F1F5F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><X size={18} aria-hidden="true" /></button>
            </div>
            <form onSubmit={submitRequest} noValidate className="space-y-4 p-4 sm:p-5">
              <NoticeBox>Support request stored locally as a demo record. No real Ministry support ticket is created.</NoticeBox>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Issue Category" error={errors.category}>
                  <select id="support-issue-category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as AdminSupportCategory }))} className="h-10 w-full border border-[#DCE3EC] bg-white px-3 text-sm outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20">
                    {ADMIN_SUPPORT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </Field>
                <Field label="Module" error={errors.module}>
                  <select id="support-module" value={form.module} onChange={(event) => setForm((current) => ({ ...current, module: event.target.value as AdminSupportModule }))} className="h-10 w-full border border-[#DCE3EC] bg-white px-3 text-sm outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20">
                    {ADMIN_SUPPORT_MODULES.map((module) => <option key={module}>{module}</option>)}
                  </select>
                </Field>
                <Field label="Subject" error={errors.subject}>
                  <input id="support-subject" value={form.subject} maxLength={120} onChange={(event) => { setForm((current) => ({ ...current, subject: event.target.value })); setErrors((current) => ({ ...current, subject: undefined })); }} className="h-10 w-full border border-[#DCE3EC] px-3 text-sm outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20" />
                </Field>
                <Field label="Priority" error={errors.priority}>
                  <select id="support-priority" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as AdminSupportPriority }))} className="h-10 w-full border border-[#DCE3EC] bg-white px-3 text-sm outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20">
                    {(['Low', 'Normal', 'High', 'Urgent'] as const).map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </Field>
                <Field label="Reference ID (optional)" error={errors.referenceId}>
                  <input id="support-reference-id-optional" value={form.referenceId} maxLength={80} onChange={(event) => { setForm((current) => ({ ...current, referenceId: event.target.value })); setErrors((current) => ({ ...current, referenceId: undefined })); }} className="h-10 w-full border border-[#DCE3EC] px-3 text-sm outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description" error={errors.description}>
                    <textarea id="support-description" value={form.description} rows={5} maxLength={2000} onChange={(event) => { setForm((current) => ({ ...current, description: event.target.value })); setErrors((current) => ({ ...current, description: undefined })); }} className="w-full resize-y border border-[#DCE3EC] px-3 py-2 text-sm outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20" />
                  </Field>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-[#DCE3EC] pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeForm} className="min-h-10 border border-[#C9D4E2] px-4 text-sm font-semibold text-[#475569] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Cancel</button>
                <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#173F7A] px-4 text-sm font-semibold text-white hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8]"><Send size={14} aria-hidden="true" /> Submit Request</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function ContactValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#E8EDF3] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="mt-1 break-words text-xs font-semibold text-[#172033]">{value}</p>
    </div>
  );
}

function NoticeBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-[#D6E1EF] bg-[#F8FAFD] px-3 py-2 text-xs leading-5 text-[#334155]">
      {children}
    </p>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const id = `support-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="block min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-[#334155]">{label}</label>
      {children}
      {error && <span role="alert" className="mt-1 block text-[11px] text-[#A8323D]">{error}</span>}
    </div>
  );
}
