'use client';

import { useMemo, useState } from 'react';
import { NotificationDetail } from '@/components/student/notifications/NotificationDetail';
import { NotificationFilters, type NotificationCategoryFilter, type NotificationSort, type NotificationStatusFilter } from '@/components/student/notifications/NotificationFilters';
import { NotificationList } from '@/components/student/notifications/NotificationList';
import { NotificationPreferences } from '@/components/student/notifications/NotificationPreferences';
import { NotificationsHeader } from '@/components/student/notifications/NotificationsHeader';
import { NotificationSummary } from '@/components/student/notifications/NotificationSummary';
import { demoNotifications, type NotificationItem } from '@/lib/notifications';

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(demoNotifications);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<NotificationCategoryFilter>('all');
  const [status, setStatus] = useState<NotificationStatusFilter>('all');
  const [sort, setSort] = useState<NotificationSort>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const unreadCount = notifications.filter((notification) => notification.status === 'unread').length;
  const selectedNotification = notifications.find((notification) => notification.id === selectedId) ?? null;

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((notification) => {
      const matchesSearch = !query || [notification.title, notification.message, notification.applicationId ?? '', notification.schemeName ?? ''].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (category === 'all' || notification.category === category) && (status === 'all' || notification.status === status);
    }).sort((first, second) => sort === 'newest' ? second.dateTime.localeCompare(first.dateTime) : first.dateTime.localeCompare(second.dateTime));
  }, [category, notifications, search, sort, status]);

  function markAsRead(id: string) {
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, status: 'read' } : notification));
  }

  function openNotification(notification: NotificationItem) {
    setSelectedId(notification.id);
    if (notification.status === 'unread') markAsRead(notification.id);
  }

  function markAllAsRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, status: 'read' })));
  }

  function resetFilters() {
    setSearch('');
    setCategory('all');
    setStatus('all');
    setSort('newest');
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <NotificationsHeader unreadCount={unreadCount} onMarkAllRead={markAllAsRead} />
      <NotificationSummary notifications={notifications} />
      <NotificationFilters search={search} category={category} status={status} sort={sort} onSearch={setSearch} onCategory={setCategory} onStatus={setStatus} onSort={setSort} onReset={resetFilters} />
      <NotificationList notifications={filteredNotifications} totalNotifications={notifications.length} onOpen={openNotification} onClear={resetFilters} />
      <NotificationPreferences />
      <p className="border-t border-[#DCE3EC] pt-3 text-[10px] leading-4 text-[#64748B]">Notifications may include automated reminders or updates generated from the application workflow. Official verification, eligibility and selection decisions follow the applicable review process.</p>
      <NotificationDetail notification={selectedNotification} onClose={() => setSelectedId(null)} onMarkRead={markAsRead} />
    </div>
  );
}