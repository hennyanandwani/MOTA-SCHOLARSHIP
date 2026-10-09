export type AdminNotificationPreferences = {
  applicationAlerts: boolean;
  verificationAlerts: boolean;
  deficiencyAlerts: boolean;
  selectionUpdates: boolean;
  systemSecurityAlerts: boolean;
  communicationNotifications: boolean;
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  ministry: string;
  officerId: string;
  officeLocation: string;
  role: string;
  status: 'Active';
  lastLogin: string;
  createdAt: string;
  accountType: string;
  authenticationMethod: string;
  sessionStatus: string;
  notificationPreferences: AdminNotificationPreferences;
};

export const ADMIN_PROFILE_STORAGE_KEY = 'mota_admin_profile_state';
export const ADMIN_PROFILE_UPDATED_EVENT = 'mota-admin-profile-updated';

export const INITIAL_ADMIN_PROFILE: AdminProfile = {
  id: 'demo-admin-account-001',
  name: 'MoTA Administrator',
  email: 'mota.admin@example.gov.in',
  phone: '+91 00000 00000',
  designation: 'Ministry Administrator',
  department: 'Administration & Scholarship Oversight',
  ministry: 'Ministry of Tribal Affairs',
  officerId: 'DEMO-MOTA-001',
  officeLocation: 'Demo Ministry Office, New Delhi',
  role: 'Administrator',
  status: 'Active',
  lastLogin: '2026-10-08T07:30:00.000Z',
  createdAt: '2026-04-01T09:00:00.000Z',
  accountType: 'Ministry Administrator',
  authenticationMethod: 'Demo / Prototype',
  sessionStatus: 'Active (demo session)',
  notificationPreferences: {
    applicationAlerts: true,
    verificationAlerts: true,
    deficiencyAlerts: true,
    selectionUpdates: true,
    systemSecurityAlerts: true,
    communicationNotifications: true,
  },
};

export type EditableAdminProfile = Pick<
  AdminProfile,
  'name' | 'email' | 'phone' | 'designation' | 'department' | 'officeLocation'
>;

export function isAdminNotificationPreferences(value: unknown): value is AdminNotificationPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const preferences = value as Partial<AdminNotificationPreferences>;
  return (
    typeof preferences.applicationAlerts === 'boolean' &&
    typeof preferences.verificationAlerts === 'boolean' &&
    typeof preferences.deficiencyAlerts === 'boolean' &&
    typeof preferences.selectionUpdates === 'boolean' &&
    typeof preferences.systemSecurityAlerts === 'boolean' &&
    typeof preferences.communicationNotifications === 'boolean'
  );
}

export function isAdminProfile(value: unknown): value is AdminProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const profile = value as Partial<AdminProfile>;
  return (
    typeof profile.id === 'string' &&
    typeof profile.name === 'string' &&
    typeof profile.email === 'string' &&
    typeof profile.phone === 'string' &&
    typeof profile.designation === 'string' &&
    typeof profile.department === 'string' &&
    typeof profile.ministry === 'string' &&
    typeof profile.officerId === 'string' &&
    typeof profile.officeLocation === 'string' &&
    typeof profile.role === 'string' &&
    profile.status === 'Active' &&
    typeof profile.lastLogin === 'string' &&
    typeof profile.createdAt === 'string' &&
    typeof profile.accountType === 'string' &&
    typeof profile.authenticationMethod === 'string' &&
    typeof profile.sessionStatus === 'string' &&
    isAdminNotificationPreferences(profile.notificationPreferences)
  );
}

export function normalizeAdminProfile(value: unknown): AdminProfile | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const saved = value as Record<string, unknown>;
  const text = <K extends keyof AdminProfile>(key: K): AdminProfile[K] =>
    typeof saved[key] === 'string' && saved[key].trim()
      ? saved[key] as AdminProfile[K]
      : INITIAL_ADMIN_PROFILE[key];
  const preferences = saved.notificationPreferences;
  const savedPreferences = preferences && typeof preferences === 'object' && !Array.isArray(preferences)
    ? preferences as Record<string, unknown>
    : {};

  return {
    ...INITIAL_ADMIN_PROFILE,
    id: text('id'),
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    designation: text('designation'),
    department: text('department'),
    ministry: text('ministry'),
    officerId: text('officerId'),
    officeLocation: text('officeLocation'),
    role: text('role'),
    status: 'Active',
    lastLogin: text('lastLogin'),
    createdAt: text('createdAt'),
    accountType: text('accountType'),
    authenticationMethod: text('authenticationMethod'),
    sessionStatus: text('sessionStatus'),
    notificationPreferences: {
      applicationAlerts: typeof savedPreferences.applicationAlerts === 'boolean' ? savedPreferences.applicationAlerts : INITIAL_ADMIN_PROFILE.notificationPreferences.applicationAlerts,
      verificationAlerts: typeof savedPreferences.verificationAlerts === 'boolean' ? savedPreferences.verificationAlerts : INITIAL_ADMIN_PROFILE.notificationPreferences.verificationAlerts,
      deficiencyAlerts: typeof savedPreferences.deficiencyAlerts === 'boolean' ? savedPreferences.deficiencyAlerts : INITIAL_ADMIN_PROFILE.notificationPreferences.deficiencyAlerts,
      selectionUpdates: typeof savedPreferences.selectionUpdates === 'boolean' ? savedPreferences.selectionUpdates : INITIAL_ADMIN_PROFILE.notificationPreferences.selectionUpdates,
      systemSecurityAlerts: typeof savedPreferences.systemSecurityAlerts === 'boolean' ? savedPreferences.systemSecurityAlerts : INITIAL_ADMIN_PROFILE.notificationPreferences.systemSecurityAlerts,
      communicationNotifications: typeof savedPreferences.communicationNotifications === 'boolean' ? savedPreferences.communicationNotifications : INITIAL_ADMIN_PROFILE.notificationPreferences.communicationNotifications,
    },
  };
}

export function getAdminProfileInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'MA';
}
