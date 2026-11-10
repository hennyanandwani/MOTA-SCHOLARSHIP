'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, ShieldCheck } from 'lucide-react';
import type { Phase6AiStatus } from '@/lib/phase6Workflow';
import {
  decrementStudentAiRetryCountdown,
  getStudentAiRetryButtonLabel,
  STUDENT_AI_RETRY_COOLDOWN_SECONDS,
} from '@/lib/studentAiRetry';

type StatusResponse = {
  status: Phase6AiStatus;
  reason: string | null;
  retryAvailable: boolean;
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
    (typeof value.reason === 'string' || value.reason === null) &&
    'retryAvailable' in value &&
    typeof value.retryAvailable === 'boolean'
  );
}

export function AiVerificationProgress({
  applicationId,
  initialStatus,
  initialReason = null,
  initialRetryAvailable = false,
  compact = false,
}: {
  applicationId: string;
  initialStatus: Phase6AiStatus;
  initialReason?: string | null;
  initialRetryAvailable?: boolean;
  compact?: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [reason, setReason] = useState(initialReason);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [retryAvailable, setRetryAvailable] = useState(initialRetryAvailable);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(
    initialRetryAvailable ? STUDENT_AI_RETRY_COOLDOWN_SECONDS : null,
  );
  const [retrying, setRetrying] = useState(false);
  const [retryProgressActive, setRetryProgressActive] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [pollingVersion, setPollingVersion] = useState(0);
  const retryLock = useRef(false);
  const retryAvailableRef = useRef(initialRetryAvailable);
  const latestStatusRef = useRef(initialStatus);

  useEffect(() => {
    if (!retryAvailable) return;
    const timer = setInterval(() => {
      setRetryCountdown(decrementStudentAiRetryCountdown);
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAvailable]);

  const updateRetryAvailability = useCallback((available: boolean) => {
    if (available && !retryAvailableRef.current) {
      setRetryCountdown(STUDENT_AI_RETRY_COOLDOWN_SECONDS);
    }
    retryAvailableRef.current = available;
    setRetryAvailable(available);
  }, []);

  useEffect(() => {
    let active = true;
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

        latestStatusRef.current = payload.status;
        if (active && !retryLock.current) {
          setStatus(payload.status);
          setReason(payload.status === 'INELIGIBLE' ? payload.reason : null);
          updateRetryAvailability(payload.retryAvailable);
          if (!activeStatuses.has(payload.status)) {
            setRetryProgressActive(false);
          }
          setRefreshFailed(false);
          setRetryError(null);
        }
      } catch {
        if (active && !controller.signal.aborted) setRefreshFailed(true);
      } finally {
        if (active && activeStatuses.has(latestStatusRef.current)) {
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
  }, [applicationId, initialStatus, pollingVersion, updateRetryAvailability]);

  async function retryVerification() {
    if (
      retryLock.current ||
      retrying ||
      !retryAvailable ||
      retryCountdown !== 0
    ) {
      return;
    }
    retryLock.current = true;
    setRetrying(true);
    setRetryProgressActive(true);
    setRetryError(null);
    updateRetryAvailability(false);
    setReason(null);
    setPollingVersion((version) => version + 1);

    try {
      const response = await fetch(
        `/api/student/applications/${encodeURIComponent(applicationId)}/ai-retry`,
        {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        },
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload === 'object' &&
            payload !== null &&
            'error' in payload &&
            typeof payload.error === 'string'
            ? payload.error
            : 'Unable to retry AI verification.',
        );
      }
      updateRetryAvailability(false);
      setStatus('WAITING_FOR_CONFIGURATION');
      latestStatusRef.current = 'WAITING_FOR_CONFIGURATION';
      setPollingVersion((version) => version + 1);
    } catch (error) {
      setRetryError(
        error instanceof Error ? error.message : 'Unable to retry AI verification.',
      );
      setRetryProgressActive(false);
      setPollingVersion((version) => version + 1);
    } finally {
      retryLock.current = false;
      setRetrying(false);
    }
  }

  const presentation = statusPresentation[status];
  const isActive = activeStatuses.has(status);
  const showRetryProgress = retryProgressActive && isActive;
  const Icon = retrying || showRetryProgress
    ? LoaderCircle
    : presentation.icon;

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
            className={status === 'IN_PROGRESS' || retrying || showRetryProgress
              ? 'animate-spin'
              : undefined}
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{presentation.title}</p>
          <p className="mt-1 text-xs leading-5 opacity-90">
            {retrying
              ? 'Starting verification retry…'
              : showRetryProgress && status === 'WAITING_FOR_CONFIGURATION'
                ? 'Your retry is submitted. Verification is starting and status refreshes automatically.'
                : presentation.description}
          </p>
          {status === 'INELIGIBLE' && reason && (
            <p className="mt-2 text-xs font-medium leading-5">{reason}</p>
          )}
          {refreshFailed && (
            <p className="mt-2 text-xs leading-5">
              Status could not be refreshed{isActive ? '; we will try again.' : '.'}
            </p>
          )}
          {retryError && (
            <p role="alert" className="mt-2 text-xs leading-5">
              {retryError}
            </p>
          )}
          {retryAvailable && (
            <button
              type="button"
              onClick={() => void retryVerification()}
              disabled={retrying || retryCountdown !== 0}
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#123362] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {retrying
                ? 'Retrying verification…'
                : getStudentAiRetryButtonLabel(retryCountdown)}
            </button>
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
