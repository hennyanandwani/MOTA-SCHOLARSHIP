import type { Application, SchemeConfig, UserRole, AuditEvent, ApplicationStatus } from '@/types';
import { randomBetween } from '@/lib/utils';

// ─── Workflow State Machine ────────────────────────────────────────────────────
// Pure TypeScript — no React, no side effects.

export function getStages(scheme: SchemeConfig) {
  return [...scheme.workflow.stages].sort((a, b) => a.order - b.order);
}

export interface AllowedTransition {
  from: string;
  to: string;
  label?: { en: string; hi?: string };
  requiresReason: boolean;
}

/**
 * Returns the list of transitions allowed from the current application stage
 * for the given role.
 */
export function getAllowedTransitions(
  app: Application,
  role: UserRole,
  scheme: SchemeConfig
): AllowedTransition[] {
  return scheme.workflow.transitions
    .filter(
      (t) =>
        t.from === app.stageKey &&
        t.allowedRoles.includes(role)
    )
    .map((t) => ({
      from: t.from,
      to: t.to,
      label: t.label,
      requiresReason: t.requiresReason,
    }));
}

export interface TransitionResult {
  app: Application;
  auditEvent: AuditEvent;
}

export interface TransitionError {
  error: string;
}

/**
 * Applies a workflow transition to an application.
 * Emits an audit event. Validates role permission and reason requirement.
 */
export function applyTransition(
  app: Application,
  toStage: string,
  actor: { id: string; role: UserRole },
  reason?: string,
  scheme?: SchemeConfig
): TransitionResult | TransitionError {
  if (!scheme) {
    return { error: 'Scheme config required for transition' };
  }

  const transition = scheme.workflow.transitions.find(
    (t) => t.from === app.stageKey && t.to === toStage
  );

  if (!transition) {
    return { error: `No transition defined from '${app.stageKey}' to '${toStage}'` };
  }

  if (!transition.allowedRoles.includes(actor.role)) {
    return {
      error: `Role '${actor.role}' is not allowed to perform this transition`,
    };
  }

  if (transition.requiresReason && (!reason || reason.trim().length === 0)) {
    return { error: 'A reason is required for this transition' };
  }

  // Determine status from stage
  const toStageConfig = scheme.workflow.stages.find((s) => s.key === toStage);
  let newStatus = app.status;

  // Map certain terminal stage keys to status
  if (toStage === 'selected') newStatus = 'selected';
  else if (toStage === 'rejected') newStatus = 'rejected';
  else if (toStage === 'deficient') newStatus = 'deficient';
  else if (toStage === 'waitlisted') newStatus = 'waitlisted';
  else if (app.status === 'deficient') newStatus = 'in_progress'; // resubmit

  const now = new Date().toISOString();

  const updatedApp: Application = {
    ...app,
    stageKey: toStage,
    status: newStatus,
    updatedAt: now,
    slaDeadline: toStageConfig
      ? new Date(Date.now() + toStageConfig.slaDays * 86400000).toISOString()
      : app.slaDeadline,
  };

  const auditEvent: AuditEvent = {
    id: `ae_${Date.now()}_${randomBetween(1000, 9999)}`,
    applicationId: app.id,
    actorId: actor.id,
    actorRole: actor.role,
    action: 'transition',
    fromStage: app.stageKey,
    toStage,
    fromStatus: app.status,
    toStatus: newStatus,
    reason,
    timestamp: now,
  };

  return { app: updatedApp, auditEvent };
}

export type SlaState = 'on_track' | 'at_risk' | 'breached';

/**
 * Computes SLA state for an application based on its deadline.
 * 'at_risk' = less than 20% of SLA time remaining.
 */
export function getSlaState(app: Application, scheme: SchemeConfig): SlaState {
  if (!app.slaDeadline) return 'on_track';

  const stage = scheme.workflow.stages.find((s) => s.key === app.stageKey);
  if (!stage) return 'on_track';

  const now = Date.now();
  const deadline = new Date(app.slaDeadline).getTime();
  const slaDuration = stage.slaDays * 86400000;
  const remaining = deadline - now;

  if (remaining <= 0) return 'breached';
  if (remaining / slaDuration < 0.2) return 'at_risk';
  return 'on_track';
}
