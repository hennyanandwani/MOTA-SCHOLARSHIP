export type AdminNotificationCategory =
  | 'applicationUpdates'
  | 'verificationAlerts'
  | 'deficiencyAlerts'
  | 'screeningAlerts'
  | 'selectionUpdates'
  | 'communicationNotifications'
  | 'securityAlerts'
  | 'systemAnnouncements';

export type NotificationChannelSettings = Record<
  AdminNotificationCategory,
  {
    portal: boolean;
    email: boolean;
    sms: boolean;
  }
>;

export type AdminSettings = {
  general: {
    academicYear: string;
    schemeId: string;
    state: string;
    applicationView: 'table' | 'cards';
    itemsPerPage: 10 | 25 | 50 | 100;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12-hour' | '24-hour';
  };
  notifications: NotificationChannelSettings;
  security: {
    sessionTimeout: '15 minutes' | '30 minutes' | '1 hour' | '4 hours';
    requireReauthentication: boolean;
    twoFactorEnabled: false;
    loginAlerts: boolean;
    sessionManagement: 'Prototype display only';
  };
  appearance: {
    theme: 'Light' | 'Dark' | 'System';
    density: 'Comfortable' | 'Compact';
    reduceMotion: boolean;
  };
  privacy: {
    localDemoData: boolean;
    activityHistory: boolean;
    sessionData: boolean;
  };
  system: {
    autoRefresh: false;
    refreshInterval: 'Off' | '30 seconds' | '1 minute' | '5 minutes';
    landingPage: 'Overview' | 'Applications' | 'Analytics & Reports';
    showDemoLabels: true;
    compactTables: boolean;
    advancedFilters: boolean;
  };
};

const notificationDefaults: NotificationChannelSettings = {
  applicationUpdates: { portal: true, email: false, sms: false },
  verificationAlerts: { portal: true, email: false, sms: false },
  deficiencyAlerts: { portal: true, email: false, sms: false },
  screeningAlerts: { portal: true, email: false, sms: false },
  selectionUpdates: { portal: true, email: false, sms: false },
  communicationNotifications: { portal: true, email: false, sms: false },
  securityAlerts: { portal: true, email: false, sms: false },
  systemAnnouncements: { portal: true, email: false, sms: false },
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  general: {
    academicYear: '2026–27',
    schemeId: '',
    state: '',
    applicationView: 'table',
    itemsPerPage: 25,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
  },
  notifications: notificationDefaults,
  security: {
    sessionTimeout: '30 minutes',
    requireReauthentication: true,
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionManagement: 'Prototype display only',
  },
  appearance: {
    theme: 'Light',
    density: 'Comfortable',
    reduceMotion: false,
  },
  privacy: {
    localDemoData: true,
    activityHistory: true,
    sessionData: true,
  },
  system: {
    autoRefresh: false,
    refreshInterval: 'Off',
    landingPage: 'Overview',
    showDemoLabels: true,
    compactTables: false,
    advancedFilters: true,
  },
};

export const ADMIN_SETTINGS_STORAGE_KEY = 'mota_admin_settings_state';

export const ADMIN_DEMO_STORAGE_KEYS = [
  ADMIN_SETTINGS_STORAGE_KEY,
  'mota_admin_profile_state',
  'mota_admin_audit_state',
  'mota_admin_communications_state',
  'mota_admin_rules_state',
  'mota_admin_schemes_state',
  'mota_admin_screening_state',
  'mota_admin_selection_state',
  'mota_admin_verification_state',
  'mota_admin_deficiencies_state',
] as const;

const notificationCategoryKeys: AdminNotificationCategory[] = [
  'applicationUpdates',
  'verificationAlerts',
  'deficiencyAlerts',
  'screeningAlerts',
  'selectionUpdates',
  'communicationNotifications',
  'securityAlerts',
  'systemAnnouncements',
];

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isAdminSettings(value: unknown): value is AdminSettings {
  if (!isObject(value)) return false;
  const { general, notifications, security, appearance, privacy, system } = value;
  if (
    !isObject(general) ||
    !isObject(notifications) ||
    !isObject(security) ||
    !isObject(appearance) ||
    !isObject(privacy) ||
    !isObject(system)
  ) return false;
  if (
    typeof general.academicYear !== 'string' ||
    typeof general.schemeId !== 'string' ||
    typeof general.state !== 'string' ||
    !['table', 'cards'].includes(String(general.applicationView)) ||
    ![10, 25, 50, 100].includes(Number(general.itemsPerPage)) ||
    !['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(String(general.dateFormat)) ||
    !['12-hour', '24-hour'].includes(String(general.timeFormat))
  ) return false;

  if (!notificationCategoryKeys.every((key) => {
    const category = notifications[key];
    return isObject(category) &&
      typeof category.portal === 'boolean' &&
      typeof category.email === 'boolean' &&
      typeof category.sms === 'boolean';
  })) return false;

  if (
    !['15 minutes', '30 minutes', '1 hour', '4 hours'].includes(String(security.sessionTimeout)) ||
    typeof security.requireReauthentication !== 'boolean' ||
    security.twoFactorEnabled !== false ||
    typeof security.loginAlerts !== 'boolean' ||
    security.sessionManagement !== 'Prototype display only'
  ) return false;

  if (
    !['Light', 'Dark', 'System'].includes(String(appearance.theme)) ||
    !['Comfortable', 'Compact'].includes(String(appearance.density)) ||
    typeof appearance.reduceMotion !== 'boolean'
  ) return false;

  if (
    typeof privacy.localDemoData !== 'boolean' ||
    typeof privacy.activityHistory !== 'boolean' ||
    typeof privacy.sessionData !== 'boolean'
  ) return false;

  return (
    system.autoRefresh === false &&
    ['Off', '30 seconds', '1 minute', '5 minutes'].includes(String(system.refreshInterval)) &&
    ['Overview', 'Applications', 'Analytics & Reports'].includes(String(system.landingPage)) &&
    system.showDemoLabels === true &&
    typeof system.compactTables === 'boolean' &&
    typeof system.advancedFilters === 'boolean'
  );
}

export function cloneDefaultAdminSettings(): AdminSettings {
  return {
    ...DEFAULT_ADMIN_SETTINGS,
    general: { ...DEFAULT_ADMIN_SETTINGS.general },
    notifications: {
      applicationUpdates: { ...notificationDefaults.applicationUpdates },
      verificationAlerts: { ...notificationDefaults.verificationAlerts },
      deficiencyAlerts: { ...notificationDefaults.deficiencyAlerts },
      screeningAlerts: { ...notificationDefaults.screeningAlerts },
      selectionUpdates: { ...notificationDefaults.selectionUpdates },
      communicationNotifications: { ...notificationDefaults.communicationNotifications },
      securityAlerts: { ...notificationDefaults.securityAlerts },
      systemAnnouncements: { ...notificationDefaults.systemAnnouncements },
    },
    security: { ...DEFAULT_ADMIN_SETTINGS.security },
    appearance: { ...DEFAULT_ADMIN_SETTINGS.appearance },
    privacy: { ...DEFAULT_ADMIN_SETTINGS.privacy },
    system: { ...DEFAULT_ADMIN_SETTINGS.system },
  };
}
