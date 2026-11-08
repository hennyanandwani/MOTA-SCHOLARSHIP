'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, ShieldCheck } from 'lucide-react';
import type { Phase6AiStatus } from '@/lib/phase6Workflow';

type StatusResponse = {
  status: Phase6AiStatus;
  reason: string | null;
};

const statusPresentation: Record<
  Phase6AiStatus,
  { title: string; description: string; className: string; icon: typeof Clock3 }
> = {
  NOT_REQUESTED: {
    title: 'Not requested',
    description: 'AI verification has not been requested for this application.',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    icon: Clock3,
  },
  WAITING_FOR_CONFIGURATION: {
    title: 'Waiting to start',
    description: 'Your application is submitted and waiting for verification to begin.',
    className: 'border-blue-200 bg-blue-50 text-[#1D5796]',
    icon: Clock3,
  },
  QUEUED: {
    title: 'Queued for verification',
    description: 'Your application is waiting to be checked.',
    className: 'border-blue-200 bg-blue-50 text-[#1D5796]',
    icon: Clock3,
  },
  IN_PROGRESS: {
    title: 'Verification in progress',
    description: 'AI checks are underway. This status refreshes automatically.',
    className: 'border-blue-200 bg-blue-50 text-[#1D5796]',
    icon: LoaderCircle,
  },
  ELIGIBLE: {
    title: 'AI checks indicate eligibility',
    description: 'This is not a final decision. Official document review and approval still follow.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
  },
  INELIGIBLE: {
    title: 'AI checks indicate ineligibility',
    description: 'Review the reason below. Your application has not been approved.',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: AlertCircle,
  },
  FAILED: {
    title: 'Verification could not be completed',
    description: 'The verification service did not return a result. This is not an eligibility decision.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: AlertCircle,
  },
  NEEDS_ATTENTION: {
    title: 'Additional review needed',
    description: 'AI checks could not determine eligibility. The application requires human review.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: ShieldCheck,
  },
};

const activeStatuses = new Set<Phase6AiStatus>([
  'WAITING_FOR_CONFIGURATION',
  'QUEUED',
  'IN_PROGRESS',
]);

const supportedStatuses = new Set<string>(Object.keys(statusPresentation));

function isStatusResponse(value: unknown): value is StatusResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    typeof value.status === 'string' &&
    supportedStatuses.has(value.status) &&
    'reason' in value &&
    (typeof value.reason === 'string' || value.reason === null)
  );
}

export function AiVerificationProgress({
  applicationId,
  initialStatus,
  initialReason = null,
  compact = false,
}: {
  applicationId: string;
  initialStatus: Phase6AiStatus;
  initialReason?: string | null;
  compact?: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [reason, setReason] = useState(initialReason);
  const [refreshFailed, setRefreshFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let currentStatus = initialStatus;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    async function refreshStatus() {
      controller = new AbortController();
      try {
        const response = await fetch(
          `/api/student/applications/${encodeURIComponent(applicationId)}/ai-status`,
          {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin',
            signal: controller.signal,
          },
        );
        const payload: unknown = await response.json();
        if (!response.ok || !isStatusResponse(payload)) {
          throw new Error('Unable to refresh AI verification status.');
        }

        currentStatus = payload.status;
        if (active) {
          setStatus(payload.status);
          setReason(payload.status === 'INELIGIBLE' ? payload.reason : null);
          setRefreshFailed(false);
        }
      } catch {
        if (active && !controller.signal.aborted) setRefreshFailed(true);
      } finally {
        if (active && activeStatuses.has(currentStatus)) {
          timer = setTimeout(() => void refreshStatus(), 5000);
        }
      }
    }

    void refreshStatus();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      controller?.abort();
    };
  }, [applicationId, initialStatus]);

  const presentation = statusPresentation[status];
  const Icon = presentation.icon;
  const isActive = activeStatuses.has(status);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`rounded-xl border ${presentation.className} ${
        compact ? 'p-3' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80">
          <Icon
            size={18}
            aria-hidden="true"
            className={status === 'IN_PROGRESS' ? 'animate-spin' : undefined}
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{presentation.title}</p>
          <p className="mt-1 text-xs leading-5 opacity-90">{presentation.description}</p>
          {status === 'INELIGIBLE' && reason && (
            <p className="mt-2 text-xs font-medium leading-5">{reason}</p>
          )}
          {refreshFailed && (
            <p className="mt-2 text-xs leading-5">
              Status could not be refreshed{isActive ? '; we will try again.' : '.'}
            </p>
          )}
          {isActive && (
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide opacity-75">
              Updates automatically
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
