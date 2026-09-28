import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UserRole } from '@/types';
import type { DemoFlags } from '@/lib/integrations';
import { defaultDemoFlags } from '@/lib/integrations';
import { siteConfig } from '@/config/site';

// ─── Session Store ─────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  avatarUrl?: string;
}

export type TextSize = 'small' | 'normal' | 'large' | 'xlarge';
export type ThemeMode = 'light' | 'dark' | 'contrast';

interface SessionState {
  // Auth
  currentUser: SessionUser | null;
  isAuthenticated: boolean;

  // Preferences
  locale: string;
  theme: ThemeMode;
  textSize: TextSize;
  liteMode: boolean; // low-data mode

  // Demo flags
  demoFlags: DemoFlags;
  isDemoMode: boolean;

  // Actions
  login: (user: SessionUser) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setLocale: (locale: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setTextSize: (size: TextSize) => void;
  toggleLiteMode: () => void;
  setDemoFlag: <K extends keyof DemoFlags>(key: K, value: DemoFlags[K]) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      locale: 'en',
      theme: 'light',
      textSize: 'normal',
      liteMode: false,
      demoFlags: defaultDemoFlags,
      isDemoMode:
        typeof window !== 'undefined'
          ? window.location.search.includes('demo=1') ||
            process.env.NEXT_PUBLIC_DEMO === '1'
          : process.env.NEXT_PUBLIC_DEMO === '1',

      login: (user) => set({ currentUser: user, isAuthenticated: true }),
      logout: () => set({ currentUser: null, isAuthenticated: false }),
      setRole: (role) =>
        set((state) => ({
          currentUser: state.currentUser ? { ...state.currentUser, role } : null,
        })),
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setTextSize: (textSize) => set({ textSize }),
      toggleLiteMode: () => set((state) => ({ liteMode: !state.liteMode })),
      setDemoFlag: (key, value) =>
        set((state) => ({
          demoFlags: { ...state.demoFlags, [key]: value },
        })),
    }),
    {
      name: 'shiksha-setu-session',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        locale: state.locale,
        theme: state.theme,
        textSize: state.textSize,
        liteMode: state.liteMode,
      }),
    }
  )
);

// ─── Text Size CSS Map ────────────────────────────────────────────────────────

export const textSizePx: Record<TextSize, number> = {
  small: 14,
  normal: 16,
  large: 18,
  xlarge: 20,
};

// ─── Demo User Presets ────────────────────────────────────────────────────────

export const demoUsers: Record<string, SessionUser> = {
  student: {
    id: 'demo-student-1',
    name: 'Ravi Kumar Munda',
    mobile: '9876543210',
    role: 'student',
  },
  guardian: {
    id: 'demo-guardian-1',
    name: 'Shanti Devi Munda',
    mobile: '9876543211',
    role: 'guardian',
  },
  institution_officer: {
    id: 'demo-inst-1',
    name: 'Prof. Anand Toppo',
    mobile: '9876543212',
    role: 'institution_officer',
  },
  state_officer: {
    id: 'demo-state-1',
    name: 'Rajesh Kumar Singh',
    mobile: '9876543213',
    role: 'state_officer',
  },
  ministry_reviewer: {
    id: 'demo-min-1',
    name: 'Dr. Priya Patel',
    mobile: '9876543214',
    role: 'ministry_reviewer',
  },
  scheme_admin: {
    id: 'demo-admin-1',
    name: 'Admin User',
    mobile: '9876543215',
    role: 'scheme_admin',
  },
  super_admin: {
    id: 'demo-super-1',
    name: 'Super Admin',
    mobile: '9876543216',
    role: 'super_admin',
  },
};
