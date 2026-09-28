import type { LucideIcon } from 'lucide-react';

export type UserRole =
  | 'student'
  | 'guardian'
  | 'institution_officer'
  | 'state_officer'
  | 'ministry_reviewer'
  | 'selection_committee'
  | 'scheme_admin'
  | 'finance_officer'
  | 'leadership'
  | 'auditor'
  | 'super_admin'
  | 'public';

export interface NavItem {
  /** i18n key for label */
  labelKey: string;
  /** fallback English label */
  label: string;
  href: string;
  icon: string; // lucide icon name
  roles: UserRole[];
  badge?: string;
  children?: NavItem[];
}

export const publicNavItems: NavItem[] = [
  { labelKey: 'nav.home', label: 'Home', href: '/', icon: 'Home', roles: ['public'] },
  { labelKey: 'nav.schemes', label: 'Schemes', href: '/schemes', icon: 'BookOpen', roles: ['public'] },
  { labelKey: 'nav.eligibility', label: 'Check Eligibility', href: '/eligibility', icon: 'CheckCircle', roles: ['public'] },
  { labelKey: 'nav.transparency', label: 'Transparency', href: '/transparency', icon: 'BarChart3', roles: ['public'] },
];

export const studentNavItems: NavItem[] = [
  { labelKey: 'nav.home', label: 'Home', href: '/portal', icon: 'Home', roles: ['student', 'guardian'] },
  { labelKey: 'nav.schemes', label: 'Schemes', href: '/portal/schemes', icon: 'BookOpen', roles: ['student', 'guardian'] },
  { labelKey: 'nav.applications', label: 'Applications', href: '/portal/applications', icon: 'FileText', roles: ['student', 'guardian'] },
  { labelKey: 'nav.documents', label: 'Documents', href: '/portal/documents', icon: 'FolderOpen', roles: ['student', 'guardian'] },
  { labelKey: 'nav.alerts', label: 'Alerts', href: '/portal/alerts', icon: 'Bell', roles: ['student', 'guardian'] },
];

export const adminNavItems: NavItem[] = [
  {
    labelKey: 'nav.dashboard', label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard',
    roles: ['institution_officer', 'state_officer', 'ministry_reviewer', 'selection_committee', 'scheme_admin', 'finance_officer', 'leadership', 'auditor', 'super_admin'],
  },
  {
    labelKey: 'nav.applications', label: 'Applications', href: '/admin/applications', icon: 'FileText',
    roles: ['institution_officer', 'state_officer', 'ministry_reviewer', 'selection_committee', 'scheme_admin', 'super_admin'],
  },
  {
    labelKey: 'nav.schemes', label: 'Schemes', href: '/admin/schemes', icon: 'BookOpen',
    roles: ['scheme_admin', 'ministry_reviewer', 'super_admin'],
  },
  {
    labelKey: 'nav.postSelection', label: 'Post-Selection', href: '/admin/post-selection', icon: 'Award',
    roles: ['selection_committee', 'finance_officer', 'super_admin'],
  },
  {
    labelKey: 'nav.simulator', label: 'Policy Simulator', href: '/admin/simulator', icon: 'FlaskConical',
    roles: ['scheme_admin', 'leadership', 'super_admin'],
  },
  {
    labelKey: 'nav.fraud', label: 'Fraud Clusters', href: '/admin/fraud', icon: 'ShieldAlert',
    roles: ['auditor', 'super_admin'],
  },
  {
    labelKey: 'nav.users', label: 'Users', href: '/admin/users', icon: 'Users',
    roles: ['super_admin'],
  },
  {
    labelKey: 'nav.integrations', label: 'Integrations', href: '/admin/integrations', icon: 'Plug',
    roles: ['super_admin', 'scheme_admin'],
  },
];

export const allNavItems: NavItem[] = [...publicNavItems, ...studentNavItems, ...adminNavItems];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return allNavItems.filter((item) => item.roles.includes(role));
}
