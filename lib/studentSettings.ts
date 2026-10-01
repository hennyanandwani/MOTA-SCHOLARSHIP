export type PortalLanguage = 'English' | 'Hindi' | 'Marathi';
export type PortalFontSize = 'default' | 'large';

export interface StudentSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  applicationAlerts: boolean;
  deadlineReminders: boolean;
  documentVerificationUpdates: boolean;
  language: PortalLanguage;
  fontSize: PortalFontSize;
  highContrast: boolean;
  reducedMotion: boolean;
  maskSensitiveInformation: boolean;
  communicationEmail: boolean;
  communicationSms: boolean;
  communicationInApp: boolean;
}

export interface StudentSettingsSnapshot {
  currentSettings: StudentSettings;
  savedSettings: StudentSettings;
}

export const defaultStudentSettings: StudentSettings = {
  emailNotifications: true,
  smsNotifications: true,
  applicationAlerts: true,
  deadlineReminders: true,
  documentVerificationUpdates: true,
  language: 'English',
  fontSize: 'default',
  highContrast: false,
  reducedMotion: false,
  maskSensitiveInformation: true,
  communicationEmail: true,
  communicationSms: true,
  communicationInApp: true,
};

const storageKey = 'mota_student_settings';

export function getSettings(): StudentSettings {
  return copySettings(readSnapshot().currentSettings);
}

export function getSavedSettings(): StudentSettings {
  return copySettings(readSnapshot().savedSettings);
}

export function getSettingsSnapshot(): StudentSettingsSnapshot {
  const snapshot = readSnapshot();
  return {
    currentSettings: copySettings(snapshot.currentSettings),
    savedSettings: copySettings(snapshot.savedSettings),
  };
}

export function persistCurrentSettings(settings: StudentSettings): void {
  const previous = readSnapshot();
  writeSnapshot({ currentSettings: copySettings(settings), savedSettings: previous.savedSettings });
}

export function saveSettings(settings: StudentSettings): void {
  const saved = copySettings(settings);
  writeSnapshot({ currentSettings: copySettings(saved), savedSettings: saved });
}

export function resetSettings(): StudentSettings {
  const defaults = copySettings(defaultStudentSettings);
  writeSnapshot({ currentSettings: copySettings(defaults), savedSettings: defaults });
  return copySettings(defaults);
}

export function areSettingsEqual(first: StudentSettings, second: StudentSettings): boolean {
  return Object.keys(defaultStudentSettings).every((key) => (
    first[key as keyof StudentSettings] === second[key as keyof StudentSettings]
  ));
}

export function copySettings(settings: StudentSettings): StudentSettings {
  return { ...settings };
}

export function maskSensitiveValue(value: string, shouldMask: boolean): string {
  if (!shouldMask || !value) return value;
  const digits = value.replace(/\D/g, '');
  if (!digits) return 'XXXX';
  return `XXXX XXXX ${digits.slice(-4).padStart(4, 'X')}`;
}

function readSnapshot(): StudentSettingsSnapshot {
  if (typeof window === 'undefined') return defaultSnapshot();

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return defaultSnapshot();

    const parsed: unknown = JSON.parse(stored);
    if (isStudentSettings(parsed)) {
      const settings = copySettings(parsed);
      return { currentSettings: settings, savedSettings: copySettings(settings) };
    }

    if (isSettingsSnapshot(parsed)) {
      return {
        currentSettings: copySettings(parsed.currentSettings),
        savedSettings: copySettings(parsed.savedSettings),
      };
    }
  } catch {
    return defaultSnapshot();
  }

  return defaultSnapshot();
}

function writeSnapshot(snapshot: StudentSettingsSnapshot): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Keep the in-memory settings usable when storage is unavailable.
  }
}

function isSettingsSnapshot(value: unknown): value is StudentSettingsSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<StudentSettingsSnapshot>;
  return isStudentSettings(snapshot.currentSettings) && isStudentSettings(snapshot.savedSettings);
}

function isStudentSettings(value: unknown): value is StudentSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<StudentSettings>;
  return (
    typeof settings.emailNotifications === 'boolean' &&
    typeof settings.smsNotifications === 'boolean' &&
    typeof settings.applicationAlerts === 'boolean' &&
    typeof settings.deadlineReminders === 'boolean' &&
    typeof settings.documentVerificationUpdates === 'boolean' &&
    (settings.language === 'English' || settings.language === 'Hindi' || settings.language === 'Marathi') &&
    (settings.fontSize === 'default' || settings.fontSize === 'large') &&
    typeof settings.highContrast === 'boolean' &&
    typeof settings.reducedMotion === 'boolean' &&
    typeof settings.maskSensitiveInformation === 'boolean' &&
    typeof settings.communicationEmail === 'boolean' &&
    typeof settings.communicationSms === 'boolean' &&
    typeof settings.communicationInApp === 'boolean'
  );
}

function defaultSnapshot(): StudentSettingsSnapshot {
  return {
    currentSettings: copySettings(defaultStudentSettings),
    savedSettings: copySettings(defaultStudentSettings),
  };
}