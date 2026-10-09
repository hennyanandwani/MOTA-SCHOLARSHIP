'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, Search, X } from 'lucide-react';
import { getAdminApplications } from '@/lib/adminData';
import {
  ADMIN_AUDIT_STORAGE_KEY,
  createInitialAuditEvents,
  isAdminAuditEventList,
  type AdminAuditEvent,
} from '@/lib/adminAuditData';
import { getInitialDeficiencyRecords } from '@/lib/adminDeficiencyData';
import { adminNavigation } from '@/lib/navigation';
import { schemes } from '@/lib/schemes';
import { getInitialVerificationRecords } from '@/lib/adminVerificationData';
import type { AdminApplicationRecord } from '@/lib/adminData';
import type { DeficiencyRecord } from '@/lib/adminDeficiencyData';
import type { Scheme } from '@/lib/schemes';
import type { VerificationRecord } from '@/lib/adminVerificationData';

const ADMIN_NOTIFICATIONS_STORAGE_KEY = 'mota_admin_notifications_state';

type PanelMode = 'search' | 'notifications' | null;
type NotificationState = {
  id: string;
  title: string;
  message: string;
  module: string;
  timestamp: string;
  reference?: string;
  href: string;
};
type SearchResult = {
  category: string;
  title: string;
  detail: string;
  href: string;
};
type SearchData = {
  applications: AdminApplicationRecord[];
  schemes: Scheme[];
  deficiencies: DeficiencyRecord[];
  verifications: VerificationRecord[];
};

const moduleRoutes: Record<string, string> = {
  Applications: '/admin/applications',
  Verification: '/admin/verification',
  Deficiencies: '/admin/deficiencies',
  Screening: '/admin/screening',
  Selection: '/admin/selection',
  Schemes: '/admin/schemes',
  Rules: '/admin/rules',
  Communications: '/admin/communications',
  Authentication: '/admin/audit',
  System: '/admin/audit',
};

const emptySearchData: SearchData = {
  applications: [],
  schemes: [],
  deficiencies: [],
  verifications: [],
};

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function notificationsFromAudit(events: AdminAuditEvent[]): NotificationState[] {
  return events
    .slice()
    .sort((first, second) => second.timestamp.localeCompare(first.timestamp))
    .slice(0, 12)
    .map((event) => {
      const route = moduleRoutes[event.module] ?? '/admin/audit';
      const reference = event.applicationId ?? event.referenceId;
      const queryKey = event.module === 'Deficiencies' ? 'search' : 'searchQuery';
      const href = reference && ['Applications', 'Verification', 'Deficiencies'].includes(event.module)
        ? `${route}?${queryKey}=${encodeURIComponent(reference)}`
        : route;
      return {
        id: event.id,
        title: event.action,
        message: event.activity.at(-1)?.description ?? `${event.module} activity recorded in demo mode.`,
        module: event.module,
        timestamp: event.timestamp,
        ...(reference ? { reference } : {}),
        href,
      };
    });
}

function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function searchExistingData(data: SearchData, value: string): SearchResult[] {
  const query = value.trim().toLowerCase();
  if (query.length < 2) return [];
  const results: SearchResult[] = [];
  const addMatches = <T,>(
    items: T[],
    category: string,
    searchableText: (item: T) => string,
    result: (item: T) => SearchResult,
  ) => {
    items.filter((item) => searchableText(item).toLowerCase().includes(query))
      .slice(0, 4)
      .forEach((item) => results.push(result(item)));
  };

  addMatches(data.applications, 'Applications', (item) => [
    item.applicationId, item.applicantName, item.schemeName, item.state,
  ].join(' '), (item) => ({
    category: 'Applications',
    title: item.applicantName,
    detail: `${item.applicationId} · ${item.schemeName} · ${item.state}`,
    href: `/admin/applications?searchQuery=${encodeURIComponent(item.applicationId)}`,
  }));
  addMatches(data.schemes, 'Schemes', (item) => `${item.id} ${item.name} ${item.academicLevel}`, (item) => ({
    category: 'Schemes',
    title: item.name,
    detail: `${item.id} · ${item.academicLevel}`,
    href: `/admin/schemes?search=${encodeURIComponent(item.name)}`,
  }));
  addMatches(data.deficiencies, 'Deficiencies', (item) => [
    item.applicationId, item.applicantName, item.scheme, item.state, item.deficiency,
  ].join(' '), (item) => ({
    category: 'Deficiencies',
    title: item.deficiency,
    detail: `${item.applicationId} · ${item.applicantName} · ${item.status}`,
    href: `/admin/deficiencies?search=${encodeURIComponent(item.applicationId)}`,
  }));
  addMatches(data.verifications, 'Verification', (item) => [
    item.applicationId, item.applicantName, item.schemeName, item.documentName, item.state,
  ].join(' '), (item) => ({
    category: 'Verification',
    title: item.documentName,
    detail: `${item.applicationId} · ${item.applicantName} · ${item.verificationStatus}`,
    href: `/admin/verification?searchQuery=${encodeURIComponent(item.applicationId)}`,
  }));

  const matchingModules = adminNavigation.filter((item) =>
    `${item.label} ${item.href}`.toLowerCase().includes(query),
  );
  matchingModules.slice(0, 5).forEach((item) => results.push({
    category: 'Admin Modules',
    title: item.label,
    detail: 'Open module',
    href: item.href,
  }));
  return results.slice(0, 12);
}

export function AdminTopbarActions() {
  const [mode, setMode] = useState<PanelMode>(null);
  const [query, setQuery] = useState('');
  const [searchData, setSearchData] = useState<SearchData>(emptySearchData);
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [storageError, setStorageError] = useState('');
  const controlsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const initialAuditEvents = useMemo(() => createInitialAuditEvents({
    applications: getAdminApplications(),
    schemes: schemes.map(({ id, name }) => ({ id, name })),
    rules: [],
  }), []);

  const searchResults = useMemo(() => searchExistingData(searchData, query), [searchData, query]);
  const unreadCount = notifications.filter(({ id }) => !readIds.includes(id)).length;

  useEffect(() => {
    setSearchData({
      applications: getAdminApplications(),
      schemes,
      deficiencies: getInitialDeficiencyRecords(),
      verifications: getInitialVerificationRecords(),
    });

    try {
      const savedAudit = window.localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY);
      const parsedAudit: unknown = savedAudit ? JSON.parse(savedAudit) : null;
      setNotifications(notificationsFromAudit(isAdminAuditEventList(parsedAudit) ? parsedAudit : initialAuditEvents));

      const savedState = window.localStorage.getItem(ADMIN_NOTIFICATIONS_STORAGE_KEY);
      if (savedState) {
        const parsedState: unknown = JSON.parse(savedState);
        if (isStringList(parsedState)) setReadIds(parsedState);
        else setStorageError('Saved notification preferences are invalid; demo notifications remain available.');
      }
    } catch {
      setNotifications(notificationsFromAudit(initialAuditEvents));
      setStorageError('Notification state could not be loaded from this browser.');
    }

    const syncStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_AUDIT_STORAGE_KEY) {
        try {
          const parsed: unknown = event.newValue ? JSON.parse(event.newValue) : null;
          setNotifications(notificationsFromAudit(isAdminAuditEventList(parsed) ? parsed : initialAuditEvents));
        } catch {
          setStorageError('Updated audit notifications could not be read.');
        }
      }
      if (event.key === ADMIN_NOTIFICATIONS_STORAGE_KEY) {
        try {
          const parsed: unknown = event.newValue ? JSON.parse(event.newValue) : [];
          if (isStringList(parsed)) setReadIds(parsed);
        } catch {
          setStorageError('Updated notification preferences could not be read.');
        }
      }
    };
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener('storage', syncStorage);
    };
  }, [initialAuditEvents]);

  useEffect(() => {
    if (mode !== 'notifications') return;
    try {
      const savedAudit = window.localStorage.getItem(ADMIN_AUDIT_STORAGE_KEY);
      const parsed: unknown = savedAudit ? JSON.parse(savedAudit) : null;
      setNotifications(notificationsFromAudit(isAdminAuditEventList(parsed) ? parsed : initialAuditEvents));
    } catch {
      setStorageError('Updated audit notifications could not be read.');
    }
  }, [mode, initialAuditEvents]);

  useEffect(() => {
    if (mode === 'search') requestAnimationFrame(() => searchInputRef.current?.focus());
    if (!mode) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!controlsRef.current?.contains(event.target as Node)) setMode(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMode(null);
      (mode === 'search' ? searchButtonRef.current : notificationButtonRef.current)?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mode]);

  function saveReadIds(nextReadIds: string[]) {
    setReadIds(nextReadIds);
    try {
      window.localStorage.setItem(ADMIN_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(nextReadIds));
      setStorageError('');
    } catch {
      setStorageError('Read status changed for this session but could not be saved in this browser.');
    }
  }

  function markRead(id: string) {
    if (!readIds.includes(id)) saveReadIds([...readIds, id]);
  }

  function markAllRead() {
    saveReadIds([...new Set([...readIds, ...notifications.map(({ id }) => id)])]);
  }

  return (
    <div ref={controlsRef} className="relative flex items-center gap-1 sm:gap-2">
      <button
        ref={searchButtonRef}
        type="button"
        aria-label="Search Admin Portal"
        aria-expanded={mode === 'search'}
        aria-controls="admin-global-search"
        onClick={() => setMode((current) => current === 'search' ? null : 'search')}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#173F7A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
      >
        <Search size={19} aria-hidden="true" />
      </button>
      <button
        ref={notificationButtonRef}
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={mode === 'notifications'}
        aria-controls="admin-notifications"
        onClick={() => setMode((current) => current === 'notifications' ? null : 'notifications')}
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#173F7A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
      >
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && (
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#C2414B] px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {mode === 'search' && (
        <section id="admin-global-search" aria-label="Admin Portal search" className="fixed right-2 top-[calc(5rem+0.5rem)] z-[70] w-[min(40rem,calc(100vw-2rem))] border border-[#DCE3EC] bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#DCE3EC] p-3">
            <Search size={16} className="shrink-0 text-[#64748B]" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search applications, applicants, schemes, or modules..."
              aria-label="Search applications, schemes, queues, and modules"
              className="h-9 min-w-0 flex-1 text-sm text-[#172033] outline-none placeholder:text-[#94A3B8]"
            />
            <button type="button" onClick={() => { setQuery(''); setMode(null); }} aria-label="Close search" className="rounded p-1.5 text-[#64748B] hover:bg-[#F1F5F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-[min(65vh,30rem)] overflow-y-auto">
            {query.trim().length < 2 ? (
              <p className="px-4 py-5 text-xs text-[#64748B]">Type at least two characters to search demo records and Admin modules.</p>
            ) : searchResults.length ? (
              <ul className="divide-y divide-[#EEF2F6]">
                {searchResults.map((result, index) => (
                  <li key={`${result.category}-${result.href}-${index}`}>
                    {index === 0 || searchResults[index - 1]?.category !== result.category ? (
                      <p className="px-4 pt-3 text-[10px] font-bold uppercase tracking-wide text-[#64748B]">{result.category}</p>
                    ) : null}
                    <Link
                      href={result.href}
                      onClick={() => setMode(null)}
                      className="block px-4 py-2.5 hover:bg-[#F8FAFD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#2563A8]"
                    >
                      <span className="block text-xs font-semibold text-[#173F7A]">{result.title}</span>
                      <span className="mt-0.5 block break-words text-[10px] text-[#64748B]">{result.detail}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p role="status" className="px-4 py-5 text-xs text-[#64748B]">No matching demo records or Admin modules. Try an application ID, name, scheme, or module.</p>
            )}
          </div>
        </section>
      )}

      {mode === 'notifications' && (
        <section id="admin-notifications" aria-label="Demo notifications" className="fixed right-2 top-[calc(5rem+0.5rem)] z-[70] w-[min(24rem,calc(100vw-2rem))] border border-[#DCE3EC] bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-[#DCE3EC] px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Notifications</h2>
              <p className="text-[10px] text-[#64748B]">Demo activity from existing audit records</p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && <button type="button" onClick={markAllRead} className="text-[10px] font-semibold text-[#173F7A] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">Mark all read</button>}
              <button type="button" onClick={() => setMode(null)} aria-label="Close notifications" className="rounded p-1.5 text-[#64748B] hover:bg-[#F1F5F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          {storageError && <p role="alert" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[10px] text-amber-900">{storageError}</p>}
          {notifications.length ? (
            <ul className="max-h-[min(70vh,34rem)] divide-y divide-[#EEF2F6] overflow-y-auto">
              {notifications.map((notification) => {
                const isRead = readIds.includes(notification.id);
                return (
                  <li key={notification.id} className={`px-4 py-3 ${isRead ? 'bg-white' : 'bg-[#F7FAFE]'}`}>
                    <div className="flex items-start gap-2">
                      <span role="img" aria-label={isRead ? 'Read' : 'Unread'} className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isRead ? 'bg-[#CBD5E1]' : 'bg-[#2563A8]'}`} />
                      <div className="min-w-0 flex-1">
                        <Link href={notification.href} onClick={() => { markRead(notification.id); setMode(null); }} className="block rounded-sm text-xs font-semibold text-[#172033] hover:text-[#173F7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                          {notification.title}
                        </Link>
                        <p className="mt-1 text-[10px] leading-4 text-[#475569]">{notification.message}</p>
                        <p className="mt-1 text-[10px] text-[#64748B]">
                          {notification.module}{notification.reference ? ` · ${notification.reference}` : ''} · {formatNotificationTime(notification.timestamp)} · {isRead ? 'Read' : 'Unread'} · DEMO
                        </p>
                      </div>
                      {!isRead && (
                        <button type="button" onClick={() => markRead(notification.id)} aria-label={`Mark ${notification.title} as read`} className="shrink-0 rounded p-1.5 text-[#64748B] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563A8]">
                          <Check size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-xs text-[#64748B]">No recent demo notifications. New administrative activity will appear here.</p>
          )}
        </section>
      )}
    </div>
  );
}
