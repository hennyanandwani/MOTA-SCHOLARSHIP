'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Database,
  Info,
  LockKeyhole,
  Save,
  Settings2,
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
  INITIAL_ADMIN_PROFILE,
  ADMIN_PROFILE_STORAGE_KEY,
  isAdminProfile,
  type AdminProfile,
} from '@/lib/adminProfileData';
import type { AdminApplicationRecord } from '@/lib/adminData';
import type { EligibilityRule } from '@/lib/adminRuleData';
import type { Scheme } from '@/lib/schemes';
import {
  ADMIN_DEMO_STORAGE_KEYS,
  ADMIN_SETTINGS_STORAGE_KEY,
  cloneDefaultAdminSettings,
  isAdminSettings,
  type AdminNotificationCategory,
  type AdminSettings,
} from '@/lib/adminSettingsData';

type Props = {
  applications: AdminApplicationRecord[];
  schemes: Pick<Scheme, 'id' | 'name'>[];
  rules: EligibilityRule[];
};

const categories = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'notifications', label: 'Notifications', icon: Activity },
  { id: 'security', label: 'Security', icon: LockKeyhole },
  { id: 'appearance', label: 'Appearance', icon: CircleHelp },
  { id: 'privacy', label: 'Data & Privacy', icon: Database },
  { id: 'system-preferences', label: 'System Preferences', icon: ShieldCheck },
] as const;

const notificationCategories: { key: AdminNotificationCategory; label: string }[] = [
  { key: 'applicationUpdates', label: 'Application updates' },
  { key: 'verificationAlerts', label: 'Verification alerts' },
  { key: 'deficiencyAlerts', label: 'Deficiency alerts' },
  { key: 'screeningAlerts', label: 'Screening alerts' },
  { key: 'selectionUpdates', label: 'Selection updates' },
  { key: 'communicationNotifications', label: 'Communication notifications' },
  { key: 'securityAlerts', label: 'Security alerts' },
  { key: 'systemAnnouncements', label: 'System announcements' },
];

type Notice = { kind: 'success' | 'error' | 'info'; text: string };

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function cloneSettings(settings: AdminSettings): AdminSettings {
  return {
    ...settings,
    general: { ...settings.general },
    notifications: {
      applicationUpdates: { ...settings.notifications.applicationUpdates },
      verificationAlerts: { ...settings.notifications.verificationAlerts },
      deficiencyAlerts: { ...settings.notifications.deficiencyAlerts },
      screeningAlerts: { ...settings.notifications.screeningAlerts },
      selectionUpdates: { ...settings.notifications.selectionUpdates },
      communicationNotifications: { ...settings.notifications.communicationNotifications },
      securityAlerts: { ...settings.notifications.securityAlerts },
      systemAnnouncements: { ...settings.notifications.systemAnnouncements },
    },
    security: { ...settings.security },
    appearance: { ...settings.appearance },
    privacy: { ...settings.privacy },
    system: { ...settings.system },
  };
}

function addAuditEntry(action: string, previousState: string, newState: string, severity: 'Info' | 'Medium' | 'High'): AdminAuditEvent {
  const timestamp = new Date().toISOString();
  const id = `AUD-${new Date().getFullYear()}-SET-${Date.now().toString().slice(-6)}`;
  return {
    id,
    timestamp,
    userId: 'DEMO-ADMIN-01',
    userName: INITIAL_ADMIN_PROFILE.name,
    role: INITIAL_ADMIN_PROFILE.role,
    action,
    actionType: 'Configuration',
    module: 'System',
    referenceId: ADMIN_SETTINGS_STORAGE_KEY,
    previousState,
    newState,
    severity,
    isDemo: true,
    activity: [
      {
        id: `${id}-created`,
        timestamp,
        description: `${action} recorded locally in demo mode.`,
      },
    ],
  };
}

function serializeSettingsRows(settings: AdminSettings): string[][] {
  const rows: string[][] = [
    ['Data Classification', 'Demo / Illustrative'],
    ['Default Academic Year', settings.general.academicYear],
    ['Default Scheme', settings.general.schemeId || 'All schemes'],
    ['Default State / Region', settings.general.state || 'All states / UTs'],
    ['Default Application View', settings.general.applicationView],
    ['Items per Page', String(settings.general.itemsPerPage)],
    ['Date Format', settings.general.dateFormat],
    ['Time Format', settings.general.timeFormat],
    ['Session Timeout', settings.security.sessionTimeout],
    ['Require Re-authentication', String(settings.security.requireReauthentication)],
    ['Login Alerts', String(settings.security.loginAlerts)],
    ['Appearance Theme', settings.appearance.theme],
    ['Appearance Density', settings.appearance.density],
    ['Reduce Motion', String(settings.appearance.reduceMotion)],
    ['Auto-refresh', 'Unavailable: no live data source'],
    ['Refresh Interval Preference', settings.system.refreshInterval],
    ['Default Landing Page Preference', settings.system.landingPage],
    ['Compact Tables Preference', String(settings.system.compactTables)],
    ['Advanced Filters Preference', String(settings.system.advancedFilters)],
  ];
  notificationCategories.forEach(({ key, label }) => {
    rows.push(
      [`${label} — Portal`, String(settings.notifications[key].portal)],
      [`${label} — Email`, String(settings.notifications[key].email)],
      [`${label} — SMS`, String(settings.notifications[key].sms)],
    );
  });
  return rows;
}

function exportSettings(settings: AdminSettings) {
  const content = [['Setting', 'Value'], ...serializeSettingsRows(settings)]
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mota-demo-settings.csv';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

function Panel({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 border border-[#DCE3EC] bg-white">
      <div className="border-b border-[#DCE3EC] px-4 py-3">
        <h3 id={`${id}-heading`} className="text-sm font-bold text-[#172033]">{title}</h3>
        {description && <p className="mt-0.5 text-xs leading-5 text-[#64748B]">{description}</p>}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
  hint,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  disabled?: boolean;
  hint?: string;
}) {
  const id = `setting-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-[#334155]">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          className="h-10 w-full appearance-none border border-[#DCE3EC] bg-white px-3 pr-9 text-sm text-[#172033] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20 disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:text-[#64748B]"
        >
          {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-[#64748B]" aria-hidden="true" />
      </div>
      {hint && <p className="mt-1 text-[10px] leading-4 text-[#64748B]">{hint}</p>}
    </div>
  );
}

function SwitchSetting({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#172033]">{label}</p>
        {description && <p className="mt-0.5 text-[11px] leading-4 text-[#64748B]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8] disabled:cursor-not-allowed disabled:opacity-60 ${checked ? 'border-[#173F7A] bg-[#173F7A]' : 'border-[#AAB6C5] bg-[#E2E8F0]'}`}
      >
        <span aria-hidden="true" className={`h-4 w-4 bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function NoticeBox({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warning' }) {
  return (
    <div className={`flex items-start gap-2 border p-3 text-xs leading-5 ${tone === 'warning' ? 'border-[#E4C98F] bg-[#FFF8E8] text-[#62450F]' : 'border-[#D6E1EF] bg-[#F8FAFD] text-[#475569]'}`}>
      {tone === 'warning'
        ? <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        : <Info size={15} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />}
      <span>{children}</span>
    </div>
  );
}

export function AdminSettingsClient({ applications, schemes, rules }: Props) {
  const initialSettings = useMemo(() => cloneDefaultAdminSettings(), []);
  const [draft, setDraft] = useState<AdminSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<AdminSettings>(initialSettings);
  const [profile, setProfile] = useState<AdminProfile>(INITIAL_ADMIN_PROFILE);
  const [activity, setActivity] = useState<AdminAuditEvent[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reset' | 'clear' | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [mobileCategory, setMobileCategory] = useState('general');

  const initialAuditEvents = useMemo(
    () => createInitialAuditEvents({ applications, schemes, rules }),
    [applications, schemes, rules],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isAdminSettings(parsed)) {
          const cloned = cloneSettings(parsed);
          setDraft(cloned);
          setSavedSettings(cloneSettings(cloned));
        } else {
          setNotice({ kind: 'error', text: 'Saved settings are invalid. Default demo preferences are shown.' });
        }
      }
    } catch {
      setNotice({ kind: 'error', text: 'Saved settings are unavailable. Preferences may not persist in this browser.' });
    }

    try {
      const savedProfile = window.localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
      if (savedProfile) {
        const parsedProfile: unknown = JSON.parse(savedProfile);
        if (isAdminProfile(parsedProfile)) setProfile(parsedProfile);
      }
    } catch {
      setProfile(INITIAL_ADMIN_PROFILE);
    }

    try {
      const savedAudit = window.localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY);
      if (savedAudit) {
        const parsedAudit: unknown = JSON.parse(savedAudit);
        setActivity(isAdminAuditEventList(parsedAudit) ? parsedAudit : initialAuditEvents);
      } else {
        setActivity(initialAuditEvents);
      }
    } catch {
      setActivity(initialAuditEvents);
    } finally {
      setHydrated(true);
    }
  }, [initialAuditEvents]);

  useEffect(() => {
    if (!confirmAction) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmAction(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [confirmAction]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedSettings),
    [draft, savedSettings],
  );

  const academicYears = useMemo(() => {
    const years = new Set(applications.map((application) => application.academicYear));
    years.add('2026–27');
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [applications]);
  const states = useMemo(
    () => [...new Set(applications.map((application) => application.state))].sort((a, b) => a.localeCompare(b)),
    [applications],
  );
  const visibleActivity = useMemo(
    () => [...activity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 4),
    [activity],
  );

  function updateGeneral<K extends keyof AdminSettings['general']>(key: K, value: AdminSettings['general'][K]) {
    setDraft((current) => ({ ...current, general: { ...current.general, [key]: value } }));
  }

  function updateSecurity<K extends keyof AdminSettings['security']>(key: K, value: AdminSettings['security'][K]) {
    setDraft((current) => ({ ...current, security: { ...current.security, [key]: value } }));
  }

  function updateAppearance<K extends keyof AdminSettings['appearance']>(key: K, value: AdminSettings['appearance'][K]) {
    setDraft((current) => ({ ...current, appearance: { ...current.appearance, [key]: value } }));
  }

  function updatePrivacy<K extends keyof AdminSettings['privacy']>(key: K, value: AdminSettings['privacy'][K]) {
    setDraft((current) => ({ ...current, privacy: { ...current.privacy, [key]: value } }));
  }

  function updateSystem<K extends keyof AdminSettings['system']>(key: K, value: AdminSettings['system'][K]) {
    setDraft((current) => ({ ...current, system: { ...current.system, [key]: value } }));
  }

  function updateNotification(
    category: AdminNotificationCategory,
    channel: 'portal' | 'email' | 'sms',
    checked: boolean,
  ) {
    setDraft((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [category]: { ...current.notifications[category], [channel]: checked },
      },
    }));
  }

  function writeAudit(event: AdminAuditEvent, useSeedWhenEmpty = true): boolean {
    try {
      const stored = window.localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : null;
      const currentEvents = isAdminAuditEventList(parsed)
        ? parsed
        : useSeedWhenEmpty
          ? initialAuditEvents
          : [];
      const nextEvents = [event, ...currentEvents];
      window.localStorage.setItem(ADMIN_AUDIT_STORAGE_KEY, JSON.stringify(nextEvents));
      setActivity(nextEvents);
      return true;
    } catch {
      setNotice({ kind: 'error', text: 'The audit event could not be saved. Check browser storage and retry.' });
      return false;
    }
  }

  function saveSettings() {
    if (!isDirty) return;
    const previous = savedSettings;
    try {
      window.localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      setNotice({ kind: 'error', text: 'Settings could not be saved in this browser. Your unsaved changes remain on screen.' });
      return;
    }
    setSavedSettings(cloneSettings(draft));
    setNotice({ kind: 'success', text: 'Settings saved successfully in demo mode.' });

    const securityChanged = JSON.stringify(previous.security) !== JSON.stringify(draft.security);
    const notificationsChanged = JSON.stringify(previous.notifications) !== JSON.stringify(draft.notifications);
    const action = securityChanged
      ? 'Security Preference Updated'
      : notificationsChanged
        ? 'Notification Preferences Updated'
        : 'System Preferences Updated';
    const event = addAuditEntry(
      action,
      'Previously saved demo settings',
      'Updated demo settings saved in this browser',
      securityChanged ? 'High' : notificationsChanged ? 'Medium' : 'Info',
    );
    writeAudit(event);
  }

  function resetSettings() {
    const defaults = cloneDefaultAdminSettings();
    try {
      window.localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      setNotice({ kind: 'error', text: 'Default settings could not be saved. Existing preferences were not changed.' });
      setConfirmAction(null);
      return;
    }
    setDraft(defaults);
    setSavedSettings(cloneSettings(defaults));
    setConfirmAction(null);
    setNotice({ kind: 'success', text: 'Settings were reset to defaults and saved in demo mode.' });
    writeAudit(addAuditEntry('Settings Reset', 'Customized demo settings', 'Predefined default demo settings', 'Medium'));
  }

  function clearDemoData() {
    const defaults = cloneDefaultAdminSettings();
    const previousValues = new Map<string, string | null>();
    try {
      ADMIN_DEMO_STORAGE_KEYS.forEach((key) => previousValues.set(key, window.localStorage.getItem(key)));
      ADMIN_DEMO_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(defaults));
      setDraft(defaults);
      setSavedSettings(cloneSettings(defaults));
      setProfile(INITIAL_ADMIN_PROFILE);
      setConfirmAction(null);
      setNotice({ kind: 'success', text: 'Known MoTA Admin demo data was cleared from this browser. Default Settings were retained.' });

      const clearEvent = addAuditEntry('Demo Data Cleared', 'Selected local MoTA Admin demo data', 'Known demo data cleared; default Settings retained', 'High');
      const eventSaved = writeAudit(clearEvent, false);
      if (!eventSaved) {
        setNotice({
          kind: 'error',
          text: 'Demo data was cleared and defaults were saved, but the audit event could not be persisted.',
        });
      }
    } catch {
      previousValues.forEach((value, key) => {
        if (value !== null) {
          try {
            window.localStorage.setItem(key, value);
          } catch {
            // Storage restoration is best effort after a browser storage error.
          }
        }
      });
      setNotice({ kind: 'error', text: 'The demo data clear did not complete. Existing values were restored where browser storage allowed.' });
      setConfirmAction(null);
    }
  }

  function resetDraft() {
    setDraft(cloneSettings(savedSettings));
  }

  function jumpToCategory(id: string) {
    setActiveCategory(id);
    setMobileCategory(id);
    document.getElementById(id)?.scrollIntoView({ behavior: draft.appearance.reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <section className="space-y-5 text-[#172033]">
      <div className="flex flex-col gap-3 border-b border-[#DCE3EC] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748B]">Administration / Preferences</span>
            <span className="border border-[#D6E1EF] bg-[#EEF4FB] px-2 py-0.5 text-[10px] font-bold tracking-[0.09em] text-[#173F7A]">DEMO SETTINGS</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172033] sm:text-[28px]">Settings</h2>
          <p className="mt-1 max-w-3xl text-sm text-[#64748B]">Configure administrator preferences, system behavior, notifications, security preferences, and interface settings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDirty && <span className="inline-flex min-h-9 items-center gap-1.5 border border-[#E4C98F] bg-[#FFF8E8] px-2.5 text-xs font-semibold text-[#79520F]"><AlertCircle size={14} aria-hidden="true" /> Unsaved changes</span>}
          <button
            type="button"
            onClick={() => setConfirmAction('reset')}
            className="min-h-10 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#475569] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={saveSettings}
            disabled={!isDirty}
            className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#173F7A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={15} aria-hidden="true" /> Save Changes
          </button>
        </div>
      </div>

      {notice && (
        <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 border px-3 py-2 text-sm ${notice.kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : notice.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-[#D6E1EF] bg-[#F8FAFD] text-[#475569]'}`}>
          <span>{notice.text}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)} className="rounded p-0.5 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit border border-[#DCE3EC] bg-white lg:sticky lg:top-24">
          <h3 className="border-b border-[#DCE3EC] px-3 py-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Settings categories</h3>
          <nav aria-label="Settings categories" className="hidden p-2 lg:block">
            {categories.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(event) => { event.preventDefault(); jumpToCategory(id); }}
                aria-current={activeCategory === id ? 'location' : undefined}
                className={`mb-1 flex min-h-10 items-center gap-2.5 px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] ${activeCategory === id ? 'bg-[#EEF4FB] text-[#173F7A]' : 'text-[#475569] hover:bg-[#F8FAFD]'}`}
              >
                <Icon size={15} aria-hidden="true" /> {label}
              </a>
            ))}
          </nav>
          <div className="p-3 lg:hidden">
            <label htmlFor="settings-category-select" className="sr-only">Go to settings category</label>
            <select
              id="settings-category-select"
              value={mobileCategory}
              onChange={(event) => jumpToCategory(event.target.value)}
              className="h-10 w-full border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
            >
              {categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div className="border-t border-[#DCE3EC] p-3">
            <div className="flex items-start gap-2">
              <UserRound size={15} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">Administrator Account</p>
                <p className="mt-1 truncate text-xs font-semibold text-[#172033]">{profile.name}</p>
                <p className="mt-0.5 text-[10px] text-[#64748B]">{profile.role} · {profile.department}</p>
                <span className="mt-1 inline-block border border-[#B6E3D0] bg-[#EAF7F1] px-1.5 py-0.5 text-[10px] font-semibold text-[#126044]">Active (demo)</span>
                <Link href="/admin/profile" className="mt-2 inline-flex min-h-8 items-center gap-1 text-[11px] font-semibold text-[#173F7A] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                  View Profile <span className="sr-only">page</span>
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <Panel id="general" title="General Preferences" description="Default view preferences saved locally for this prototype.">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Default Academic Year" value={draft.general.academicYear} onChange={(value) => updateGeneral('academicYear', value)} options={academicYears.map((year) => ({ value: year, label: year }))} />
              <SelectField label="Default Scheme" value={draft.general.schemeId} onChange={(value) => updateGeneral('schemeId', value)} options={[{ value: '', label: 'All schemes' }, ...schemes.map((scheme) => ({ value: scheme.id, label: scheme.name }))]} />
              <SelectField label="Default State / Region" value={draft.general.state} onChange={(value) => updateGeneral('state', value)} options={[{ value: '', label: 'All states / UTs' }, ...states.map((state) => ({ value: state, label: state }))]} />
              <SelectField label="Default Application View" value={draft.general.applicationView} onChange={(value) => updateGeneral('applicationView', value as AdminSettings['general']['applicationView'])} options={[{ value: 'table', label: 'Table' }, { value: 'cards', label: 'Cards' }]} hint="Stored as a default preference; current page views may not consume this setting." />
              <SelectField label="Items per Page" value={String(draft.general.itemsPerPage)} onChange={(value) => updateGeneral('itemsPerPage', Number(value) as AdminSettings['general']['itemsPerPage'])} options={[10, 25, 50, 100].map((count) => ({ value: String(count), label: String(count) }))} />
              <SelectField label="Date Format" value={draft.general.dateFormat} onChange={(value) => updateGeneral('dateFormat', value as AdminSettings['general']['dateFormat'])} options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((format) => ({ value: format, label: format }))} hint="Saved locally as a preference; existing pages continue to use their current format." />
              <SelectField label="Time Format" value={draft.general.timeFormat} onChange={(value) => updateGeneral('timeFormat', value as AdminSettings['general']['timeFormat'])} options={[{ value: '12-hour', label: '12-hour' }, { value: '24-hour', label: '24-hour' }]} />
            </div>
            <div className="flex flex-col gap-3 border-t border-[#E8EDF3] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-[#64748B]">Save changes to persist your preferences in this browser.</p>
              <button type="button" onClick={saveSettings} disabled={!isDirty} className="inline-flex min-h-9 items-center justify-center gap-2 bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8] disabled:cursor-not-allowed disabled:opacity-50">
                <Save size={13} aria-hidden="true" /> Save Changes
              </button>
            </div>
          </Panel>

          <Panel id="notifications" title="Notification Preferences" description="Configure demo notification preferences by event and channel.">
            <div className="grid gap-2 border border-[#DCE3EC] bg-[#F8FAFD] p-3 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(72px,100px))]">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">Notification category</span>
              <span className="text-center text-[10px] font-bold uppercase tracking-wide text-[#64748B]">Portal Notifications</span>
              <span className="text-center text-[10px] font-bold uppercase tracking-wide text-[#64748B]">Email Notifications</span>
              <span className="text-center text-[10px] font-bold uppercase tracking-wide text-[#64748B]">SMS Notifications</span>
              {notificationCategories.map(({ key, label }) => (
                <div key={key} className="col-span-full grid items-center gap-2 border-t border-[#E8EDF3] py-2 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(72px,100px))]">
                  <p className="text-xs font-semibold text-[#172033]">{label}</p>
                  {(['portal', 'email', 'sms'] as const).map((channel) => {
                    const enabled = draft.notifications[key][channel];
                    const unavailable = channel !== 'portal';
                    const switchLabel = `${label} — ${channel === 'portal' ? 'Portal' : channel === 'email' ? 'Email' : 'SMS'}`;
                    return (
                      <div key={channel} className="flex items-center justify-between gap-2 sm:justify-center">
                        <span className="text-[10px] text-[#64748B] sm:hidden">{channel === 'portal' ? 'Portal notifications' : channel === 'email' ? 'Email notifications' : 'SMS notifications'}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={switchLabel}
                          onClick={() => updateNotification(key, channel, !enabled)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8] ${enabled ? 'border-[#173F7A] bg-[#173F7A]' : 'border-[#AAB6C5] bg-[#E2E8F0]'}`}
                        >
                          <span aria-hidden="true" className={`h-4 w-4 bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                        {unavailable && <span className="sr-only">Preference only; external delivery is not connected.</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <NoticeBox tone="warning">External email/SMS delivery is not connected in this prototype. Email and SMS controls save local preferences only and do not deliver messages.</NoticeBox>
          </Panel>

          <Panel id="security" title="Security & Access" description="Display and preference controls only. Production security enforcement is not connected.">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Session Timeout" value={draft.security.sessionTimeout} onChange={(value) => updateSecurity('sessionTimeout', value as AdminSettings['security']['sessionTimeout'])} options={['15 minutes', '30 minutes', '1 hour', '4 hours'].map((value) => ({ value, label: value }))} hint="Saved as a preference; it does not control or terminate the current session." />
              <div className="flex items-center justify-between gap-4 border border-[#E8EDF3] p-3">
                <div>
                  <p className="text-xs font-semibold text-[#172033]">Require re-authentication</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#64748B]">Rule changes, selection decisions, scheme changes, official overrides, and permission changes.</p>
                </div>
                <SwitchSetting label="Require re-authentication for sensitive actions" checked={draft.security.requireReauthentication} onChange={(value) => updateSecurity('requireReauthentication', value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-[#E8EDF3] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#172033]">Two-factor authentication</p>
                    <p className="mt-1 text-[11px] text-[#64748B]">Status: Disabled / not configured in demo</p>
                  </div>
                  <span className="border border-[#DCE3EC] bg-[#F1F5F9] px-2 py-1 text-[10px] font-semibold text-[#475569]">Not configured</span>
                </div>
                <button type="button" onClick={() => setNotice({ kind: 'info', text: 'Authentication configuration is handled by the production identity service; this prototype only displays the setting.' })} className="mt-3 min-h-8 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                  Configure 2FA
                </button>
              </div>
              <div className="border border-[#E8EDF3] p-3">
                <SwitchSetting label="Login alerts" description="Illustrative preference only; does not trigger authentication notifications." checked={draft.security.loginAlerts} onChange={(value) => updateSecurity('loginAlerts', value)} />
                <p className="mt-2 border-t border-[#E8EDF3] pt-2 text-[10px] text-[#64748B]">Active session management: prototype display only</p>
              </div>
            </div>
            <NoticeBox tone="warning">Authentication configuration is handled by the production identity service; this prototype only displays the setting. Session timeout, re-authentication, and login-alert preferences do not enforce real security policy.</NoticeBox>
            <Link href="/admin/audit" className="inline-flex min-h-9 items-center gap-2 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
              <Activity size={14} aria-hidden="true" /> View demo login activity
            </Link>
          </Panel>

          <Panel id="appearance" title="Appearance" description="The portal currently provides a light theme. Unsupported themes are shown but unavailable.">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Theme" value={draft.appearance.theme} onChange={(value) => updateAppearance('theme', value as AdminSettings['appearance']['theme'])} options={[
                { value: 'Light', label: 'Light — available' },
                { value: 'Dark', label: 'Dark — coming soon', disabled: true },
                { value: 'System', label: 'System preference — coming soon', disabled: true },
              ]} />
              <SelectField label="Density" value={draft.appearance.density} onChange={(value) => updateAppearance('density', value as AdminSettings['appearance']['density'])} options={[{ value: 'Comfortable', label: 'Comfortable' }, { value: 'Compact', label: 'Compact — saved preference only' }]} hint="Compact density is saved locally but is not yet applied across existing Admin modules." />
            </div>
            <SwitchSetting label="Reduce motion" description="Applies to Settings page category navigation; other modules may retain their current motion behavior." checked={draft.appearance.reduceMotion} onChange={(value) => updateAppearance('reduceMotion', value)} />
          </Panel>

          <Panel id="privacy" title="Data & Privacy" description="Review browser data and manage explicitly scoped demo records. Privacy switches below save display preferences only and do not disable workflow data storage.">
            <NoticeBox>This prototype stores selected preferences and demo workflow data locally in the browser. Production deployment should use secure server-side storage and access controls.</NoticeBox>
            <div className="grid gap-2 sm:grid-cols-3">
              <PrivacyStatus label="Session data" detail="Display preference for illustrative session metadata." checked={draft.privacy.sessionData} onChange={(value) => updatePrivacy('sessionData', value)} />
              <PrivacyStatus label="Local demo data" detail="Display preference only; does not disable workflow persistence." checked={draft.privacy.localDemoData} onChange={(value) => updatePrivacy('localDemoData', value)} />
              <PrivacyStatus label="Activity history" detail="Display preference for demo audit activity." checked={draft.privacy.activityHistory} onChange={(value) => updatePrivacy('activityHistory', value)} />
            </div>
            <div className="flex flex-col gap-3 border-t border-[#E8EDF3] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-[#172033]">Data export</p>
                <p className="mt-0.5 text-[11px] text-[#64748B]">Download current settings only; no personal profile data is included.</p>
              </div>
              <button type="button" onClick={() => exportSettings(draft)} className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                <ArrowDownToLine size={14} aria-hidden="true" /> Export Settings CSV
              </button>
            </div>
            <div className="flex flex-col gap-2 border border-[#E8C9CC] bg-[#FDF8F8] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-[#7F2932]">Clear demo data</p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#72575A]">Clears only the known MoTA Admin localStorage keys listed in the confirmation. Other browser and student data are not affected.</p>
              </div>
              <button type="button" onClick={() => setConfirmAction('clear')} className="min-h-9 shrink-0 border border-[#D9AEB2] px-3 text-xs font-semibold text-[#96313B] hover:bg-[#FCEDEE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                Clear Demo Data
              </button>
            </div>
          </Panel>

          <Panel id="system-preferences" title="System Preferences" description="Prototype defaults and interface preferences; no live backend refresh is available.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-[#E8EDF3] p-3">
                <SwitchSetting label="Auto-refresh dashboard data" description="Unavailable without a live data source; no polling will run." checked={false} disabled />
                <span className="mt-2 inline-block border border-[#DCE3EC] bg-[#F1F5F9] px-2 py-1 text-[10px] font-semibold text-[#64748B]">Disabled — no live backend</span>
              </div>
              <SelectField label="Refresh interval preference" value={draft.system.refreshInterval} onChange={(value) => updateSystem('refreshInterval', value as AdminSettings['system']['refreshInterval'])} options={['Off', '30 seconds', '1 minute', '5 minutes'].map((value) => ({ value, label: value }))} hint="Stored for future integration; not used to poll data." />
              <SelectField label="Default landing page" value={draft.system.landingPage} onChange={(value) => updateSystem('landingPage', value as AdminSettings['system']['landingPage'])} options={[
                { value: 'Overview', label: 'Overview' },
                { value: 'Applications', label: 'Applications' },
                { value: 'Analytics & Reports', label: 'Analytics & Reports' },
              ]} hint="Saved locally as a preference; does not change sign-in routing." />
            </div>
            <div className="space-y-3 border-t border-[#E8EDF3] pt-4">
              <SwitchSetting label="Show demo labels" description="Required prototype disclosure labels remain visible and cannot be hidden." checked={true} disabled />
              <SwitchSetting label="Enable compact tables" description="Saved preference only; current Admin tables do not yet apply a global density setting." checked={draft.system.compactTables} onChange={(value) => updateSystem('compactTables', value)} />
              <SwitchSetting label="Enable advanced filters" description="Saved interface preference; module-specific filters retain their existing behavior." checked={draft.system.advancedFilters} onChange={(value) => updateSystem('advancedFilters', value)} />
            </div>
            <NoticeBox tone="warning">Working locally in prototype: UI preferences, localStorage preferences, and demo data controls. Production integration required: real authentication, session management, SMS/email delivery, server-side security policies, and government identity systems.</NoticeBox>
          </Panel>

          <Panel id="administrator-account" title="Administrator Account" description="Account details are linked to the Admin Profile module.">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#C9D8EB] bg-[#EEF4FB] text-xs font-bold text-[#173F7A]">
                  {profile.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'MA'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#172033]">{profile.name}</p>
                  <p className="mt-0.5 text-xs text-[#64748B]">{profile.role} · {profile.department}</p>
                  <span className="mt-1 inline-block border border-[#B6E3D0] bg-[#EAF7F1] px-2 py-0.5 text-[10px] font-semibold text-[#126044]">Active (demo)</span>
                </div>
              </div>
              <Link href="/admin/profile" className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                View Profile
              </Link>
            </div>
          </Panel>

          <Panel id="recent-audit-activity" title="Recent Settings & Admin Activity" description="Recent records from the existing Audit Logs module; no separate activity system is created.">
            {visibleActivity.length ? (
              <ol className="divide-y divide-[#E8EDF3]">
                {visibleActivity.map((event) => (
                  <li key={event.id} className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <Activity size={15} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#172033]">{event.action}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#64748B]">{event.module}{event.referenceId ? ` · ${event.referenceId}` : ''}</p>
                      <time dateTime={event.timestamp} className="mt-1 block text-[10px] text-[#64748B]">{formatTimestamp(event.timestamp)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : <p className="text-xs text-[#64748B]">No demo activity available.</p>}
            <Link href="/admin/audit" className="mt-4 inline-flex min-h-9 items-center gap-2 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
              <Activity size={14} aria-hidden="true" /> View Audit Logs
            </Link>
          </Panel>
        </div>
      </div>

      {isDirty && (
        <div className="sticky bottom-2 z-20 flex flex-col gap-2 border border-[#C9D4E2] bg-white p-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-[#79520F]">You have unsaved settings changes.</p>
          <div className="flex gap-2">
            <button type="button" onClick={resetDraft} className="min-h-9 border border-[#C9D4E2] px-3 text-xs font-semibold text-[#475569] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Discard</button>
            <button type="button" onClick={saveSettings} className="inline-flex min-h-9 items-center gap-2 bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#123363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]"><Save size={13} aria-hidden="true" /> Save Changes</button>
          </div>
        </div>
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/40 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmAction(null);
          }}
        >
          <section role="alertdialog" aria-modal="true" aria-labelledby="settings-confirm-title" aria-describedby="settings-confirm-description" className="w-full border border-[#DCE3EC] bg-white p-4 shadow-xl sm:max-w-lg sm:p-5">
            <h3 id="settings-confirm-title" className="text-base font-bold text-[#172033]">{confirmAction === 'reset' ? 'Reset settings to defaults?' : 'Clear MoTA Admin demo data?'}</h3>
            {confirmAction === 'reset' ? (
              <p id="settings-confirm-description" className="mt-2 text-sm leading-6 text-[#475569]">Your unsaved or customized preferences will be replaced with the predefined defaults and saved in this browser.</p>
            ) : (
              <div id="settings-confirm-description" className="mt-2 space-y-3 text-sm leading-6 text-[#475569]">
                <p>This removes only these known localStorage keys for the MoTA Admin prototype:</p>
                <ul className="grid gap-x-3 gap-y-1 border border-[#E8EDF3] bg-[#F8FAFD] p-3 font-mono text-[10px] sm:grid-cols-2">
                  {ADMIN_DEMO_STORAGE_KEYS.filter((key) => key !== ADMIN_SETTINGS_STORAGE_KEY).map((key) => <li key={key} className="break-all">{key}</li>)}
                </ul>
                <p>Student data and other browser storage are not affected. Default Settings will be retained, and the existing audit trail will be cleared before a new demo clear event is recorded. This cannot be undone.</p>
              </div>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#DCE3EC] pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmAction(null)} className="min-h-10 border border-[#C9D4E2] px-4 text-sm font-semibold text-[#475569] hover:bg-[#F6F8FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Cancel</button>
              <button type="button" onClick={confirmAction === 'reset' ? resetSettings : clearDemoData} className={`min-h-10 px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563A8] ${confirmAction === 'clear' ? 'bg-[#96313B] hover:bg-[#7F2932]' : 'bg-[#173F7A] hover:bg-[#123363]'}`}>
                {confirmAction === 'reset' ? 'Reset to Defaults' : 'Clear Demo Data'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function PrivacyStatus({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="border border-[#E8EDF3] p-3">
      <SwitchSetting label={label} checked={checked} onChange={onChange} />
      <p className="mt-1 text-[10px] leading-4 text-[#64748B]">{detail}</p>
    </div>
  );
}
