import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import type {
  ApplicationStatus,
  VerificationStatus,
  DeficiencyStatus,
  WorkflowStage,
} from '@/lib/adminData';

type BadgeType =
  | 'status'
  | 'verification'
  | 'deficiency'
  | 'stage'
  | 'risk';

type ApplicationStatusBadgeProps = {
  type?: BadgeType;
  value: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
};

export function ApplicationStatusBadge({
  type = 'status',
  value,
  size = 'sm',
  showIcon = true,
  className = '',
}: ApplicationStatusBadgeProps) {
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon: React.ComponentType<{ className?: string; size?: number }> | null = null;

  switch (value) {
    // ApplicationStatus values
    case 'Selected':
    case 'Sanctioned':
    case 'Verified':
    case 'Resolved':
    case 'Low':
      styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      break;

    case 'Under Review':
    case 'In Progress':
    case 'Pending':
    case 'Medium':
      styleClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Clock;
      break;

    case 'Action Required':
    case 'Discrepancy Flagged':
    case 'Notice Issued':
    case 'High':
      styleClasses = 'bg-rose-50 text-rose-800 border-rose-200';
      Icon = AlertTriangle;
      break;

    case 'Failed':
    case 'Rejected':
    case 'Escalated':
      styleClasses = 'bg-rose-100 text-rose-900 border-rose-300 font-semibold';
      Icon = XCircle;
      break;

    case 'Student Resubmitted':
      styleClasses = 'bg-purple-50 text-purple-800 border-purple-200';
      Icon = RotateCcw;
      break;

    case 'Screened':
    case 'Scrutiny':
      styleClasses = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      Icon = ShieldCheck;
      break;

    case 'Submitted':
    case 'Verification':
      styleClasses = 'bg-blue-50 text-blue-800 border-blue-200';
      Icon = Clock;
      break;

    case 'Selection':
    case 'Disbursement':
      styleClasses = 'bg-teal-50 text-teal-800 border-teal-200';
      Icon = CheckCircle;
      break;

    case 'None':
      styleClasses = 'bg-slate-50 text-slate-600 border-slate-200';
      Icon = MinusCircle;
      break;

    default:
      styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      Icon = null;
      break;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-tight shrink-0 select-none ${styleClasses} ${sizeClasses} ${className}`}
    >
      {showIcon && Icon && <Icon size={iconSize} className="shrink-0" aria-hidden="true" />}
      <span>{value}</span>
    </span>
  );
}