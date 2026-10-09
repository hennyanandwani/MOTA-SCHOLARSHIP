'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  ExternalLink,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import {
  ADMIN_AUDIT_STORAGE_KEY,
  createInitialAuditEvents,
  isAdminAuditEventList,
  type AdminAuditEvent,
} from '@/lib/adminAuditData';
import {
  ADMIN_PROFILE_STORAGE_KEY,
  ADMIN_PROFILE_UPDATED_EVENT,
  INITIAL_ADMIN_PROFILE,
  isAdminProfile,
  type AdminNotificationPreferences,
  type AdminProfile,
  type EditableAdminProfile,
} from '@/lib/adminProfileData';
import type { AdminApplicationRecord } from '@/lib/adminData';
import type { EligibilityRule } from '@/lib/adminRuleData';
import type { Scheme } from '@/lib/schemes';

type Props = {
  applications: AdminApplicationRecord[];
  schemes: Pick<Scheme, 'id' | 'name'>[];
  rules: EligibilityRule[];
};

type EditableProfileField = keyof EditableAdminProfile;
type ProfileErrors = Partial<Record<EditableProfileField, string>>;

const editableFields: {
  key: EditableProfileField;
  label: string;
  type?: string;
  autoComplete?: string;
  maxLength: number;
}[] = [
  { key: 'name', label: 'Full Name', autoComplete: 'name', maxLength: 80 },
  { key: 'email', label: 'Email Address', type: 'email', autoComplete: 'email', maxLength: 120 },
  { key: 'phone', label: 'Phone Number', type: 'tel', autoComplete: 'tel', maxLength: 24 },
  { key: 'designation', label: 'Designation', autoComplete: 'organization-title', maxLength: 80 },
  { key: 'department', label: 'Department', autoComplete: 'organization', maxLength: 100 },
  { key: 'officeLocation', label: 'Office Location', autoComplete: 'address-level2', maxLength: 100 },
];

const permissionRows: {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  review: boolean;
  export: boolean;
}[] = [
  { module: 'Dashboard', view: true, create: false, edit: false, review: false, export: true },
  { module: 'Applications', view: true, create: false, edit: true, review: true, export: true },
  { module: 'Verification', view: true, create: false, edit: true, review: true, export: true },
  { module: 'Deficiencies', view: true, create: true, edit: true, review: true, export: true },
  { module: 'Screening', view: true, create: false, edit: true, review: true, export: true },
  { module: 'Selection', view: true, create: false, edit: true, review: true, export: true },
  { module: 'Schemes', view: true, create: true, edit: true, review: true, export: true },
  { module: 'Rules', view: true, create: true, edit: true, review: true, export: true },
  { module: 'Communications', view: true, create: true, edit: true, review: true, export: true },
  { module: 'Analytics', view: true, create: false, edit: false, review: false, export: true },
  { module: 'Audit Logs', view: true, create: false, edit: false, review: false, export: true },
];

const preferenceItems: { key: keyof AdminNotificationPreferences; label: string; description: string }[] = [
  { key: 'applicationAlerts', label: 'Application alerts', description: 'New submissions and application status changes.' },
  { key: 'verificationAlerts', label: 'Verification alerts', description: 'Document verification activity and review queues.' },
  { key: 'deficiencyAlerts', label: 'Deficiency alerts', description: 'New notices, responses, and escalations.' },
  { key: 'selectionUpdates', label: 'Selection updates', description: 'Screening, recommendation, and approval workflow updates.' },
  { key: 'systemSecurityAlerts', label: 'System / security alerts', description: 'Illustrative account and system notices.' },
  { key: 'communicationNotifications', label: 'Communication notifications', description: 'Demo communication activity and status changes.' },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'MA';
}

function profileForm(profile: AdminProfile): EditableAdminProfile {
  return {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    designation: profile.designation,
    department: profile.department,
    officeLocation: profile.officeLocation,
  };
}

function getProfileErrors(form: EditableAdminProfile): ProfileErrors {
  const errors: ProfileErrors = {};
  if (form.name.trim().length < 2) errors.name = 'Enter a name with at least 2 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  const phoneDigits = form.phone.replace(/\D/g, '');
  if (phoneDigits.length < 8 || phoneDigits.length > 15) errors.phone = 'Enter a phone number with 8 to 15 digits.';
  if (form.designation.trim().length < 2) errors.designation = 'Enter a valid designation.';
  if (form.department.trim().length < 2) errors.department = 'Enter a valid department.';
  if (form.officeLocation.trim().length < 2) errors.officeLocation = 'Enter a valid office location.';
  return errors;
}

function Panel({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="min-w-0 border border-[#DCE3EC] bg-white">
      <div className="flex flex-col gap-2 border-b border-[#DCE3EC] px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#172033]">{title}</h3>
          {description && <p className="mt-0.5 text-xs leading-5 text-[#64748B]">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ProfileValue({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof UserRound }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-[#64748B]">{label}</dt>
      <dd className="mt-1 flex min-w-0 items-center gap-2 text-sm font-semibold text-[#172033]">
        {Icon && <Icon size={14} className="shrink-0 text-[#64748B]" aria-hidden="true" />}
        <span className="break-words">{value}</span>
      </dd>
    </div>
  );
}

export function AdminProfileClient({ applications, schemes, rules }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile>(INITIAL_ADMIN_PROFILE);
  const [activity, setActivity] = useState<AdminAuditEvent[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditableAdminProfile>(() => profileForm(INITIAL_ADMIN_PROFILE));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [feedback, setFeedback] = useState('');
  const [storageError, setStorageError] = useState('');
  const [securityNotice, setSecurityNotice] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const initialAuditEvents = useMemo(
    () => createInitialAuditEvents({ applications, schemes, rules }),
    [applications, schemes, rules],
  );

  useEffect(() => {
    try {
      const storedProfile = window.localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
      if (storedProfile) {
        const parsed: unknown = JSON.parse(storedProfile);
        if (isAdminProfile(parsed)) setProfile(parsed);
        else setStorageError('Saved profile data is invalid. Illustrative default profile details are shown.');
      }
    } catch {
      setStorageError('Saved profile data is unavailable. Updates may not persist in this browser.');
    }

    try {
      const savedAudit = window.localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY);
      if (savedAudit) {
        const parsedAudit: unknown = JSON.parse(savedAudit);
        if (isAdminAuditEventList(parsedAudit)) setActivity(parsedAudit);
        else setActivity(initialAuditEvents);
      } else {
        setActivity(initialAuditEvents);
      }
    } catch {
      setActivity(initialAuditEvents);
    } finally {
      setHydrated(true);
    }

    const refreshActivity = (event: StorageEvent) => {
      if (event.key !== ADMIN_AUDIT_STORAGE_KEY || !event.newValue) return;
      try {
        const parsedAudit: unknown = JSON.parse(event.newValue);
        if (isAdminAuditEventList(parsedAudit)) setActivity(parsedAudit);
      } catch {
        setActivity(initialAuditEvents);
      }
    };
    window.addEventListener('storage', refreshActivity);
    return () => window.removeEventListener('storage', refreshActivity);
  }, [initialAuditEvents]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent(ADMIN_PROFILE_UPDATED_EVENT, { detail: profile }));
      setStorageError('');
    } catch {
      setStorageError('Profile preferences could not be saved in this browser. Current values remain active for this session.');
    }
  }, [profile, hydrated]);

  useEffect(() => {
    if (!editOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeEditor();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [editOpen]);

  const recentActivity = useMemo(
    () => [...activity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6),
    [activity],
  );

  function openEditor() {
    setForm(profileForm(profile));
    setErrors({});
    setEditOpen(true);
  }

  function closeEditor() {
    setEditOpen(false);
    setErrors({});
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = getProfileErrors(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setProfile((current) => ({
      ...current,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      designation: form.designation.trim(),
      department: form.department.trim(),
      officeLocation: form.officeLocation.trim(),
    }));
    setFeedback('Profile updated in demo mode.');
    closeEditor();
  }

  function updatePreference(key: keyof AdminNotificationPreferences, value: boolean) {
    setProfile((current) => ({
      ...current,
      notificationPreferences: {
        ...current.notificationPreferences,
        [key]: value,
      },
    }));
    setFeedback('Demo notification preference updated.');
  }

  function unavailableSecurityAction(action: string) {
    setSecurityNotice(`${action} was not performed. The production authentication service is not connected in this prototype.`);
  }

  function signOut() {
    router.push('/');
  }

  return (
    <section className="space-y-5 text-[#172033]">
      <div className="flex flex-col gap-3 border-b border-[#DCE3EC] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748B]">Administration / Account</span>
            <span className="border border-[#D6E1EF] bg-[#EEF4FB] px-2 py-0.5 text-[10px] font-bold tracking-[0.09em] text-[#173F7A]">DEMO ADMIN PROFILE</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172033] sm:text-[28px]">Administrator Profile</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748B]">View and manage your Ministry administrator account information and profile preferences.</p>
        </div>
        <button
          type="button"
          onClick={openEditor}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start bg-[#173F7A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8]"
        >
          <Edit3 size={15} aria-hidden="true" /> Edit Profile
        </button>
      </div>

      {(feedback || storageError) && (
        <div role="status" className={`flex items-start justify-between gap-3 border px-3 py-2 text-sm ${storageError ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          <span>{storageError || feedback}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => { setFeedback(''); setStorageError(''); }}
            className="rounded p-0.5 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <section aria-labelledby="profile-overview-heading" className="border border-[#DCE3EC] bg-white">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#C9D8EB] bg-[#EEF4FB] text-lg font-bold text-[#173F7A]">
              {initials(profile.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="profile-overview-heading" className="text-xl font-bold text-[#172033]">{profile.name}</h3>
                <span className="inline-flex items-center gap-1 border border-[#B6E3D0] bg-[#EAF7F1] px-2 py-1 text-[10px] font-bold text-[#126044]">
                  <CheckCircle2 size={12} aria-hidden="true" /> Active
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[#475569]">{profile.role} · {profile.designation}</p>
              <p className="mt-1 text-xs text-[#64748B]">{profile.ministry}</p>
              <p className="mt-1 text-[11px] text-[#64748B]">Last active: {formatDate(profile.lastLogin)} <span className="text-[#94A3B8]">(demo timestamp)</span></p>
            </div>
          </div>
          <div className="flex max-w-xs items-start gap-2 border-l-2 border-[#A9BED8] pl-3 text-xs leading-5 text-[#475569]">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />
            <span>Official account indicator — illustrative prototype profile; no Ministry identity service is connected.</span>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div className="min-w-0 space-y-5">
          <Panel
            title="Personal Information"
            description="Fictional demonstration administrator details. Employee and contact details are not real credentials."
            action={
              <button type="button" onClick={openEditor} className="inline-flex min-h-8 items-center gap-1.5 border border-[#C9D4E2] px-2.5 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                <Edit3 size={13} aria-hidden="true" /> Edit
              </button>
            }
          >
            <dl className="grid min-w-0 gap-x-6 gap-y-5 sm:grid-cols-2">
              <ProfileValue label="Full Name" value={profile.name} icon={UserRound} />
              <ProfileValue label="Email Address" value={profile.email} icon={Mail} />
              <ProfileValue label="Phone Number" value={profile.phone} icon={Phone} />
              <ProfileValue label="Designation" value={profile.designation} />
              <ProfileValue label="Department" value={profile.department} />
              <ProfileValue label="Ministry" value={profile.ministry} />
              <ProfileValue label="Employee / Officer ID" value="DEMO-MOTA-001 (fictional)" />
              <ProfileValue label="Location / Office" value={profile.officeLocation} icon={MapPin} />
            </dl>
          </Panel>

          <Panel
            title="Account Information"
            description="Authentication and session values below are illustrative prototype data."
          >
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <ProfileValue label="Account Status" value="Active (demo)" />
              <ProfileValue label="Account Type" value="Ministry Administrator" />
              <ProfileValue label="Authentication Method" value="Demo / Prototype" />
              <ProfileValue label="Last Login" value={`${formatDate(profile.lastLogin)} (demo)`} icon={Clock3} />
              <ProfileValue label="Account Created" value={`${formatDate(profile.createdAt)} (demo)`} />
              <ProfileValue label="Session Status" value="Active (demo session)" icon={CheckCircle2} />
            </dl>
          </Panel>

          <Panel
            title="Role & Permissions"
            description="Permissions shown are illustrative prototype permissions. This matrix is read-only; access cannot be granted or changed here."
            action={<span className="border border-[#DCE3EC] bg-[#F8FAFD] px-2 py-1 text-[10px] font-semibold text-[#475569]">{profile.role}</span>}
          >
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead className="bg-[#F8FAFD] text-[10px] uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Module</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">View</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">Create</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">Edit</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">Approve / Review</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF3] text-xs">
                  {permissionRows.map((row) => (
                    <tr key={row.module}>
                      <th scope="row" className="px-3 py-2.5 font-semibold text-[#334155]">{row.module}</th>
                      {(['view', 'create', 'edit', 'review', 'export'] as const).map((permission) => (
                        <td key={permission} className="px-3 py-2.5 text-center">
                          {row[permission]
                            ? <span className="inline-flex items-center gap-1 font-semibold text-[#126044]"><Check size={13} aria-hidden="true" /><span className="sr-only">Available</span></span>
                            : <span className="text-[#94A3B8]" aria-label="Not listed">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 sm:hidden">
              {permissionRows.map((row) => (
                <article key={row.module} className="border border-[#E8EDF3] p-3">
                  <h4 className="text-xs font-bold text-[#172033]">{row.module}</h4>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {([
                      ['View', row.view],
                      ['Create', row.create],
                      ['Edit', row.edit],
                      ['Approve / Review', row.review],
                      ['Export', row.export],
                    ] as const).map(([label, available]) => (
                      <li key={label} className={`inline-flex items-center gap-1 border px-2 py-1 text-[10px] font-semibold ${available ? 'border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]' : 'border-[#DCE3EC] bg-[#F8FAFD] text-[#64748B]'}`}>
                        {available ? <Check size={11} aria-hidden="true" /> : <X size={11} aria-hidden="true" />}
                        {label}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </Panel>

          <Panel
            id="notification-preferences"
            title="Notification Preferences"
            description="These demo preferences are stored locally in this browser; they do not control real Ministry notifications."
            action={
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#64748B]">
                <Settings size={12} aria-hidden="true" /> Profile preferences
              </span>
            }
          >
            <div className="divide-y divide-[#E8EDF3]">
              {preferenceItems.map(({ key, label, description }) => (
                <div key={key} className="flex min-h-14 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#172033]">{label}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[#64748B]">{description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.notificationPreferences[key]}
                    aria-label={`${label}: ${profile.notificationPreferences[key] ? 'on' : 'off'}`}
                    onClick={() => updatePreference(key, !profile.notificationPreferences[key])}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8] ${profile.notificationPreferences[key] ? 'border-[#173F7A] bg-[#173F7A]' : 'border-[#AAB6C5] bg-[#E2E8F0]'}`}
                  >
                    <span className={`h-4 w-4 bg-white shadow-sm transition-transform ${profile.notificationPreferences[key] ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="min-w-0 space-y-5">
          <Panel
            title="Security & Access"
            description="Prototype-only account information. The production authentication service is not connected."
          >
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <SecurityValue label="Password" value="Managed by authentication service" />
                <SecurityValue label="Two-factor authentication" value="Not configured in demo" />
                <SecurityValue label="Active sessions" value="1 illustrative session" />
                <SecurityValue label="Recent login activity" value="Demo events in audit log" />
              </div>
              {securityNotice && (
                <div role="status" className="flex items-start gap-2 border border-amber-200 bg-amber-50 p-2.5 text-xs leading-5 text-amber-900">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{securityNotice}</span>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => unavailableSecurityAction('Password change')} className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                  <KeyRound size={14} aria-hidden="true" /> Change Password
                </button>
                <button type="button" onClick={() => unavailableSecurityAction('2FA configuration')} className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                  <ShieldCheck size={14} aria-hidden="true" /> Configure 2FA
                </button>
                <Link href="/admin/audit" className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                  <Activity size={14} aria-hidden="true" /> View Login Activity
                </Link>
                <button type="button" onClick={() => unavailableSecurityAction('Sign out other sessions')} className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#DCE3EC] px-3 text-xs font-semibold text-[#475569] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                  <LogOut size={14} aria-hidden="true" /> Sign Out Other Sessions
                </button>
              </div>
              <p className="border-l-2 border-[#A9BED8] pl-2 text-[11px] leading-5 text-[#64748B]">Security actions above do not change credentials, configure 2FA, or terminate sessions in this prototype.</p>
            </div>
          </Panel>

          <Panel
            title="Recent Administrative Activity"
            description="Latest illustrative events loaded from the Audit Logs module."
            action={
              <Link href="/admin/audit" className="inline-flex min-h-8 items-center gap-1 border border-[#C9D4E2] px-2.5 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                View Full Audit Logs <ChevronRight size={14} aria-hidden="true" />
              </Link>
            }
          >
            {recentActivity.length ? (
              <ol className="divide-y divide-[#E8EDF3]">
                {recentActivity.map((event) => (
                  <li key={event.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[#D6E1EF] bg-[#F8FAFD] text-[#173F7A]">
                      <Activity size={14} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#172033]">{event.action}</p>
                      <p className="mt-0.5 text-[11px] text-[#64748B]">{event.module}{event.referenceId ? ` · ${event.referenceId}` : ''}</p>
                      <time dateTime={event.timestamp} className="mt-1 block text-[10px] text-[#64748B]">{formatDate(event.timestamp)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[#64748B]">No illustrative activity records are available.</p>
            )}
          </Panel>

          <Panel title="Profile Actions" description="Shortcuts to account preferences, audit activity, and the existing sign-out route.">
            <div className="grid gap-2">
              <a href="#notification-preferences" className="inline-flex min-h-10 items-center justify-between gap-3 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                <span className="inline-flex items-center gap-2"><Settings size={14} aria-hidden="true" /> Open Settings & Preferences</span>
                <ArrowDownRight size={14} aria-hidden="true" />
              </a>
              <Link href="/admin/audit" className="inline-flex min-h-10 items-center justify-between gap-3 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                <span className="inline-flex items-center gap-2"><Activity size={14} aria-hidden="true" /> View Audit Activity</span>
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
              <button type="button" onClick={signOut} className="inline-flex min-h-10 items-center justify-between gap-3 border border-[#E8C9CC] px-3 text-xs font-semibold text-[#96313B] hover:bg-[#FDF4F4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                <span className="inline-flex items-center gap-2"><LogOut size={14} aria-hidden="true" /> Sign Out</span>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
              <p className="text-[10px] leading-4 text-[#64748B]">Sign out follows the shared prototype behavior and returns to the portal landing page. No identity session is revoked by this demo action.</p>
            </div>
          </Panel>
        </div>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/40 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="max-h-[95dvh] w-full overflow-y-auto border border-[#DCE3EC] bg-white shadow-xl sm:max-w-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#DCE3EC] bg-white px-4 py-4 sm:px-5">
              <div>
                <h3 id="edit-profile-title" className="text-lg font-bold text-[#172033]">Edit Profile</h3>
                <p className="mt-1 text-xs text-[#64748B]">Changes are stored locally for this prototype only.</p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Close profile editor"
                className="rounded p-2 text-[#64748B] hover:bg-[#F1F5F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={saveProfile} noValidate className="space-y-4 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {editableFields.map(({ key, label, type = 'text', autoComplete, maxLength }) => (
                  <label key={key} className="block min-w-0">
                    <span className="mb-1.5 block text-xs font-semibold text-[#334155]">{label}</span>
                    <input
                      type={type}
                      autoFocus={key === 'name'}
                      autoComplete={autoComplete}
                      value={form[key]}
                      maxLength={maxLength}
                      required
                      aria-invalid={Boolean(errors[key])}
                      aria-describedby={errors[key] ? `${key}-error` : undefined}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, [key]: event.target.value }));
                        setErrors((current) => ({ ...current, [key]: undefined }));
                      }}
                      className={`h-10 w-full border bg-white px-3 text-sm text-[#172033] outline-none focus:ring-2 focus:ring-[#2563A8]/20 ${errors[key] ? 'border-[#B83A46] focus:border-[#B83A46]' : 'border-[#DCE3EC] focus:border-[#2563A8]'}`}
                    />
                    {errors[key] && <span id={`${key}-error`} role="alert" className="mt-1 block text-[11px] text-[#A8323D]">{errors[key]}</span>}
                  </label>
                ))}
              </div>
              <p className="border-l-2 border-[#A9BED8] pl-2 text-[11px] leading-5 text-[#64748B]">Ministry, role, account type, and officer ID are read-only demonstration fields.</p>
              <div className="flex flex-col-reverse gap-2 border-t border-[#DCE3EC] pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeEditor} className="min-h-10 border border-[#C9D4E2] px-4 text-sm font-semibold text-[#475569] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                  Cancel
                </button>
                <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#173F7A] px-4 text-sm font-semibold text-white hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8]">
                  <Save size={15} aria-hidden="true" /> Save Changes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

function SecurityValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#E8EDF3] p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="mt-1 text-xs font-medium leading-5 text-[#334155]">{value}</p>
    </div>
  );
}
