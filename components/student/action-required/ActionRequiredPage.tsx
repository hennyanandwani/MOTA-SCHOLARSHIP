'use client';

import { useState } from 'react';
import { ActionFilters, type ActionSort, type ActionStatusFilter, type ActionTypeFilter } from '@/components/student/action-required/ActionFilters';
import { ActionInfoNote } from '@/components/student/action-required/ActionInfoNote';
import { ActionList } from '@/components/student/action-required/ActionList';
import { ActionRequiredHeader } from '@/components/student/action-required/ActionRequiredHeader';
import { ActionSummary } from '@/components/student/action-required/ActionSummary';
import { ResolvedActions } from '@/components/student/action-required/ResolvedActions';
import { demoOpenActions, demoResolvedActions, type ActionItem } from '@/lib/actionRequired';

export function ActionRequiredPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<ActionTypeFilter>('All');
  const [status, setStatus] = useState<ActionStatusFilter>('Open');
  const [sort, setSort] = useState<ActionSort>('Most Recent');

  const matchingActions = [...demoOpenActions, ...demoResolvedActions].filter((action) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [action.title, action.schemeName, action.applicationId, action.issue, action.requiredAction].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (type === 'All' || type === 'Other' ? type !== 'Other' : action.type === type) && action.status === status;
  }).sort((first, second) => {
    if (sort === 'Priority') return priorityRank[first.priority] - priorityRank[second.priority] || second.raisedAt.localeCompare(first.raisedAt);
    if (sort === 'Oldest') return first.raisedAt.localeCompare(second.raisedAt);
    return second.raisedAt.localeCompare(first.raisedAt);
  });

  const filteredOpen = matchingActions.filter((action) => action.status === 'Open');
  const filteredResolved = matchingActions.filter((action) => action.status === 'Resolved');
  const hasFilters = Boolean(search.trim()) || type !== 'All';

  function clearFilters() {
    setSearch('');
    setType('All');
    setStatus('Open');
    setSort('Most Recent');
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <ActionRequiredHeader />
      <ActionSummary openActions={demoOpenActions} resolvedCount={demoResolvedActions.length} />
      <section aria-labelledby="items-attention-heading" className="flex min-w-0 items-start gap-2.5 rounded-xl border border-amber-200 bg-[#FFFBEB] p-4 sm:p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[#94600D]"><span className="text-base font-bold">!</span></span>
        <div className="min-w-0"><h2 id="items-attention-heading" className="text-sm font-semibold text-[#573B0A]">Items that need your attention</h2><p className="mt-1 text-xs leading-5 text-[#765719]">Complete these actions to keep your application moving through the official workflow.</p></div>
      </section>

      <ActionFilters search={search} type={type} status={status} sort={sort} onSearch={setSearch} onType={setType} onStatus={setStatus} onSort={setSort} onClear={clearFilters} />

      {status === 'Open' ? (
        <>
          <ActionList actions={filteredOpen} allCaughtUp={!hasFilters} />
          <ResolvedActions actions={demoResolvedActions} />
        </>
      ) : (
        filteredResolved.length > 0
          ? <ResolvedActions actions={filteredResolved} open />
          : <p className="rounded-lg border border-dashed border-[#DCE3EC] bg-white px-4 py-6 text-center text-xs text-[#64748B]">No resolved items match these filters.</p>
      )}

      <ActionInfoNote />
    </div>
  );
}

const priorityRank: Record<ActionItem['priority'], number> = {
  Required: 0,
  Important: 1,
  Review: 2,
};