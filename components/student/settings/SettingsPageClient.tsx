'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, CircleHelp, Download, Eye, Languages, LockKeyhole, LogOut, MessageSquare, ShieldCheck, UserRound } from 'lucide-react';
import { SettingsDialog } from './SettingsDialog';
import { SettingsSection } from './SettingsSection';
import { SettingsToggle } from './SettingsToggle';
import { useStudentSettings, useStudentTranslation } from './StudentSettingsProvider';
import { areSettingsEqual, type StudentSettings } from '@/lib/studentSettings';

type DialogKind = 'login-activity' | 'change-password' | 'deactivate-account' | 'reset-settings' | null;

const selectClassName = 'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';

export function SettingsPageClient() {
  const {
    currentSettings: settings,
    savedSettings,
    setCurrentSettings,
    saveCurrentSettings,
    cancelChanges,
    resetToDefaults,
  } = useStudentSettings();
  const t = useStudentTranslation();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [feedback, setFeedback] = useState('');
  const hasUnsavedChanges = !areSettingsEqual(settings, savedSettings);

  function updateNotification(key: 'emailNotifications' | 'smsNotifications' | 'applicationAlerts' | 'deadlineReminders' | 'documentVerificationUpdates') {
    setCurrentSettings((current) => ({ ...current, [key]: !current[key] }));
    setFeedback('');
  }

  function updateAccessibility(key: 'highContrast' | 'reducedMotion') {
    setCurrentSettings((current) => ({ ...current, [key]: !current[key] }));
    setFeedback('');
  }

  function updatePrivacy() {
    setCurrentSettings((current) => ({ ...current, maskSensitiveInformation: !current.maskSensitiveInformation }));
    setFeedback('');
  }

  function updateCommunication(key: 'communicationEmail' | 'communicationSms' | 'communicationInApp') {
    setCurrentSettings((current) => ({ ...current, [key]: !current[key] }));
    setFeedback('');
  }

  function saveChanges() {
    saveCurrentSettings();
    setFeedback('Your settings have been saved.');
  }

  function discardChanges() {
    cancelChanges();
    setFeedback('');
  }

  function showDemoFeedback(message: string) {
    setDialog(null);
    setFeedback(message);
  }

  const dialogContent = dialog === 'login-activity'
    ? {
        title: 'Login activity',
        description: 'This is illustrative demo information. No authentication or login history service is connected.',
        body: <div className="rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] p-3"><p className="text-xs font-semibold text-[#334155]">{t('Current browser session')}</p><p className="mt-1 text-[11px] leading-5 text-[#64748B]">{t('Demo session · Activity details are not collected or stored.')}</p></div>,
      }
    : dialog === 'change-password'
      ? {
          title: 'Change password',
          description: 'Password management is a demo interaction only. Authentication is not connected and no password will be changed.',
          body: <p className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-[#31577F]">{t('When account services are available, password changes will be handled through the official sign-in process.')}</p>,
        }
      : dialog === 'deactivate-account'
        ? {
            title: 'Deactivate account?',
            description: 'This demo will not deactivate or delete your account. Confirming only closes this dialog and displays a local message.',
            body: <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-[#684B10]">{t('Your scholarship and fellowship application records are not changed.')}</p>,
            confirmLabel: 'Confirm demo action',
            onConfirm: () => showDemoFeedback('Demo only. Your account has not been deactivated.'),
          }
        : dialog === 'reset-settings'
          ? {
              title: 'Reset settings to default?',
              description: 'This restores all local settings to their default values. It does not affect profile information.',
              body: <p className="rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] p-3 text-xs leading-5 text-[#475569]">{t('Your default preferences will be saved in this browser.')}</p>,
              confirmLabel: 'Reset settings',
              onConfirm: () => {
                resetToDefaults();
                setDialog(null);
                setFeedback('Settings have been restored to default.');
              },
            }
          : null;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <header className="min-w-0">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#64748B]">
          <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">{t('Student Portal')}</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span aria-current="page" className="font-medium text-[#334155]">{t('Settings')}</span>
        </nav>
        <h1 className="mt-2 text-2xl font-bold text-[#172033]">{t('Settings')}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748B]">{t('Manage your account preferences and portal experience.')}</p>
      </header>

      {feedback && <p role="status" aria-live="polite" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium leading-5 text-[#166534]"><CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{t(feedback)}</p>}

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
        <SettingsSection id="account-preferences" title="Account Preferences" description="Controls your notification preference for this portal. These demo controls do not send or block actual messages." icon={<Bell size={16} />}>
          <div className="divide-y divide-[#EEF1F5]">
            <SettingsToggle id="email-notifications" label="Email notifications" checked={settings.emailNotifications} onChange={() => updateNotification('emailNotifications')} />
            <SettingsToggle id="sms-notifications" label="SMS notifications" checked={settings.smsNotifications} onChange={() => updateNotification('smsNotifications')} />
            <SettingsToggle id="application-status-alerts" label="Application status alerts" checked={settings.applicationAlerts} onChange={() => updateNotification('applicationAlerts')} />
            <SettingsToggle id="deadline-reminders" label="Important deadline reminders" checked={settings.deadlineReminders} onChange={() => updateNotification('deadlineReminders')} />
            <SettingsToggle id="document-verification-updates" label="Document verification updates" checked={settings.documentVerificationUpdates} onChange={() => updateNotification('documentVerificationUpdates')} />
          </div>
        </SettingsSection>

        <SettingsSection id="language-accessibility" title="Language & Accessibility" description="These display preferences apply locally in this demo." icon={<Languages size={16} />}>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <label htmlFor="preferred-language" className="block min-w-0 text-xs font-medium text-[#475569]">{t('Preferred language')}
              <select id="preferred-language" value={settings.language} onChange={(event) => { const language = event.target.value as StudentSettings['language']; setCurrentSettings((current) => ({ ...current, language })); setFeedback(language === 'English' ? '' : 'Language preference saved. Full portal translation will be applied when multilingual content is enabled.'); }} className={selectClassName}>
                <option value="English">{t('English')}</option><option value="Hindi">{t('Hindi')}</option><option value="Marathi">{t('Marathi')}</option>
              </select>
            </label>
            <label htmlFor="font-size" className="block min-w-0 text-xs font-medium text-[#475569]">{t('Font size')}
              <select id="font-size" value={settings.fontSize} onChange={(event) => { setCurrentSettings((current) => ({ ...current, fontSize: event.target.value as StudentSettings['fontSize'] })); setFeedback(''); }} className={selectClassName}>
                <option value="default">{t('Default')}</option><option value="large">{t('Large')}</option>
              </select>
            </label>
          </div>
          <div className="mt-3 divide-y divide-[#EEF1F5] border-t border-[#EEF1F5] pt-1">
            <SettingsToggle id="high-contrast" label="High contrast mode" checked={settings.highContrast} onChange={() => updateAccessibility('highContrast')} />
            <SettingsToggle id="reduced-motion" label="Reduced motion" checked={settings.reducedMotion} onChange={() => updateAccessibility('reducedMotion')} />
          </div>
        </SettingsSection>

        <SettingsSection id="privacy-security" title="Privacy & Security" description="Manage demo privacy preferences and view account-related information." icon={<ShieldCheck size={16} />}>
          <div className="divide-y divide-[#EEF1F5]">
            <SettingsToggle id="mask-sensitive-information" label="Mask sensitive information" description="Keep sensitive values obscured in the portal interface." checked={settings.maskSensitiveInformation} onChange={updatePrivacy} />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#64748B]">This setting only changes on-screen display and does not provide security protection.</p>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#EEF1F5] pt-3">
            <button type="button" onClick={() => setDialog('login-activity')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><UserRound size={14} aria-hidden="true" />Login activity</button>
            <button type="button" onClick={() => setDialog('change-password')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><LockKeyhole size={14} aria-hidden="true" />Change password</button>
          </div>
        </SettingsSection>

        <SettingsSection id="communication-preferences" title="Communication Preferences" description="Current channel settings for this demo account." icon={<MessageSquare size={16} />}>
          <div className="divide-y divide-[#EEF1F5]">
            <SettingsToggle id="communication-email" label="Email" checked={settings.communicationEmail} showStatus onChange={() => updateCommunication('communicationEmail')} />
            <SettingsToggle id="communication-sms" label="SMS" checked={settings.communicationSms} showStatus onChange={() => updateCommunication('communicationSms')} />
            <SettingsToggle id="communication-in-app" label="In-app notifications" checked={settings.communicationInApp} showStatus onChange={() => updateCommunication('communicationInApp')} />
          </div>
          <p className="mt-3 border-t border-[#EEF1F5] pt-3 text-[10px] leading-4 text-[#64748B]">Official communications may still be sent when required for application processing.</p>
        </SettingsSection>

        <SettingsSection id="data-account" title="Data & Account" description="These controls are demo-only and do not call account services." icon={<Download size={16} />}>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => setFeedback('Demo only. No information file was generated.')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><Download size={14} aria-hidden="true" />{t('Download my information')}</button>
            <button type="button" onClick={() => setDialog('deactivate-account')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#E9C7C9] bg-white px-3 text-xs font-semibold text-[#A8323D] transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><AlertTriangle size={14} aria-hidden="true" />{t('Deactivate account')}</button>
            <button type="button" onClick={() => setFeedback('Sign out is a demo action; your session remains active.')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#334155] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><LogOut size={14} aria-hidden="true" />{t('Sign out')}</button>
            <button type="button" onClick={() => setDialog('reset-settings')} className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold text-[#2563A8] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">{t('Reset to default settings')}</button>
          </div>
        </SettingsSection>

        <aside aria-labelledby="settings-governance-heading" className="flex min-w-0 items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
          <CircleHelp size={17} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
          <div className="min-w-0"><h2 id="settings-governance-heading" className="text-sm font-semibold text-[#172033]">{t('Important information')}</h2><p className="mt-1 text-xs leading-5 text-[#475569]">{t('Some notifications and communications may be required for official scholarship or fellowship processing and cannot be disabled.')}</p></div>
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#DCE3EC] bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:px-4">
        <div className="min-w-0">
          <p className="text-[10px] leading-4 text-[#64748B]">{t('Preference changes are saved locally for this demo.')}</p>
          {hasUnsavedChanges && <p className="mt-1 text-xs font-medium text-[#80520B]">{t('You have unsaved changes.')}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button type="button" onClick={discardChanges} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#B8C9DC] bg-white px-4 text-xs font-semibold text-[#334155] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">{t('Cancel')}</button>
          <button type="button" onClick={saveChanges} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">{t('Save changes')}</button>
        </div>
      </div>

      {dialogContent && <SettingsDialog title={dialogContent.title} description={dialogContent.description} onClose={() => setDialog(null)} confirmLabel={dialogContent.confirmLabel} onConfirm={dialogContent.onConfirm}>{dialogContent.body}</SettingsDialog>}
    </div>
  );
}
