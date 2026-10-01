import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  User,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  CheckCircle2,
  ArrowUpRight,
  ExternalLink,
  FileCode2,
  History,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import type {
  AdminApplicationRecord,
  AdminActivityLog,
  WorkflowStage,
} from '@/lib/adminData';
import { getRecentAdminActivity } from '@/lib/adminData';

type ApplicationInspectorProps = {
  application: AdminApplicationRecord | null;
  onClose: () => void;
};

const WORKFLOW_STAGES_ORDER: { stage: WorkflowStage; label: string; description: string }[] = [
  {
    stage: 'Submitted',
    label: '1. Application Submitted',
    description: 'Received via portal with preliminary metadata verification',
  },
  {
    stage: 'Verification',
    label: '2. Document Verification',
    description: 'DigiLocker certificate match and automated OCR authenticity verification',
  },
  {
    stage: 'Scrutiny',
    label: '3. Eligibility Verification',
    description: 'Statutory income ceiling, ST community guidelines, and academic check',
  },
  {
    stage: 'Screening',
    label: '4. Official Scrutiny & Screening',
    description: 'Discipline-wise merit screening and quota evaluation committee',
  },
  {
    stage: 'Selection',
    label: '5. Selection & Sanction',
    description: 'Final award list compilation and Ministry sanction order',
  },
  {
    stage: 'Disbursement',
    label: '6. Selection / Outcome & PFMS',
    description: 'Direct Benefit Transfer (DBT) dispatch via Aadhaar Bridge Payment',
  },
];

export function ApplicationInspector({
  application,
  onClose,
}: ApplicationInspectorProps) {
  const [showFullDossier, setShowFullDossier] = useState(false);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFullDossier) {
          setShowFullDossier(false);
        } else {
          onClose();
        }
      }
    };

    if (application) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [application, showFullDossier, onClose]);

  if (!application) return null;

  // Get related activity logs
  const allActivities = getRecentAdminActivity();
  const relatedActivities = allActivities.filter(
    (act) => act.applicationId === application.applicationId
  );
  const displayedActivities =
    relatedActivities.length > 0 ? relatedActivities : allActivities.slice(0, 3);

  // Stage progression helper
  const getStageIndex = (stage: WorkflowStage): number => {
    switch (stage) {
      case 'Submitted':
        return 0;
      case 'Verification':
        return 1;
      case 'Scrutiny':
        return 2;
      case 'Screening':
        return 3;
      case 'Selection':
        return 4;
      case 'Disbursement':
        return 5;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(application.currentStage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="inspector-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-[#DCE3EC] bg-white shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5">
          <div className="min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#173F7A]">
                {application.applicationId}
              </span>
              <ApplicationStatusBadge value={application.status} size="sm" />
              <ApplicationStatusBadge type="risk" value={`Risk: ${application.riskScore}`} size="sm" />
            </div>
            <h2 id="inspector-title" className="mt-1 text-base font-bold text-[#172033] truncate">
              {application.applicantName}
            </h2>
            <p className="text-xs text-[#64748B] truncate mt-0.5">
              {application.schemeName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close application inspector"
            className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-200/70 hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-[#172033]">
          {/* Full Dossier Modal/Panel Toggle Notification */}
          {showFullDossier && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#173F7A] text-xs flex items-center gap-1.5">
                  <Info size={14} /> Full Application Dossier (Simulated Mode)
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullDossier(false)}
                  className="text-xs text-[#2563A8] font-semibold hover:underline"
                >
                  Collapse Dossier
                </button>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Displaying raw statutory application data. All records are cryptographically stamped with DigiLocker verification hash <span className="font-mono text-[10px]">#0x8B44F7E9</span>.
              </p>
            </div>
          )}

          {/* Section A: Applicant Information */}
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <div className="flex items-center gap-2 font-semibold text-[#172033] border-b border-[#EEF1F5] pb-2.5 mb-3">
              <User size={15} className="text-[#173F7A]" aria-hidden="true" />
              <h3>A. Applicant Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 text-xs">
              <div>
                <span className="text-[11px] text-[#64748B]">Full Name</span>
                <p className="font-semibold text-[#172033]">{application.applicantName}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Category</span>
                <p className="font-semibold text-[#172033]">{application.category} (Scheduled Tribe)</p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Gender</span>
                <p className="font-semibold text-[#172033]">{application.gender}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Domicile State</span>
                <p className="font-semibold text-[#172033]">{application.state}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">District</span>
                <p className="font-semibold text-[#172033]">{application.district}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Family Annual Income</span>
                <p className="font-semibold text-[#172033]">{formatCurrency(application.familyIncome)}</p>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[11px] text-[#64748B]">Institution & Course</span>
                <p className="font-semibold text-[#172033]">{application.course}</p>
                <p className="text-[11px] text-[#64748B]">{application.institutionName}</p>
              </div>
            </div>
          </section>

          {/* Section B: Application Details */}
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <div className="flex items-center gap-2 font-semibold text-[#172033] border-b border-[#EEF1F5] pb-2.5 mb-3">
              <FileText size={15} className="text-[#173F7A]" aria-hidden="true" />
              <h3>B. Application Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 text-xs">
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[11px] text-[#64748B]">Scheme</span>
                <p className="font-semibold text-[#172033]">{application.schemeName}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Academic Cycle</span>
                <p className="font-semibold text-[#172033]">{application.academicYear}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Submitted On</span>
                <p className="font-semibold text-[#172033]">{application.submittedDate}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Current Stage</span>
                <p className="mt-0.5">
                  <ApplicationStatusBadge type="stage" value={application.currentStage} size="sm" showIcon={false} />
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Application Status</span>
                <p className="mt-0.5">
                  <ApplicationStatusBadge type="status" value={application.status} size="sm" />
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] text-[#64748B]">Assigned Scrutiny Desk</span>
                <p className="font-semibold text-[#172033]">{application.assignedOfficer || 'General Pool'}</p>
              </div>
            </div>

            {application.notes && (
              <div className="mt-3 rounded-lg bg-[#F8FAFC] border border-[#EEF1F5] p-2.5 text-[11px] text-[#64748B]">
                <strong className="text-[#172033]">Official Notes: </strong>
                {application.notes}
              </div>
            )}
          </section>

          {/* Section C: Verification Summary */}
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <div className="flex items-center justify-between border-b border-[#EEF1F5] pb-2.5 mb-3">
              <div className="flex items-center gap-2 font-semibold text-[#172033]">
                <ShieldCheck size={15} className="text-[#173F7A]" aria-hidden="true" />
                <h3>C. Verification Summary</h3>
              </div>
              <ApplicationStatusBadge type="verification" value={application.verificationStatus} size="sm" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-2.5">
                <span className="block text-[11px] font-medium text-emerald-800">Verified Docs</span>
                <span className="mt-0.5 text-lg font-bold text-emerald-900">
                  {application.verifiedDocsCount ?? 3}
                </span>
              </div>
              <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-2.5">
                <span className="block text-[11px] font-medium text-amber-800">Pending Docs</span>
                <span className="mt-0.5 text-lg font-bold text-amber-900">
                  {application.pendingDocsCount ?? 0}
                </span>
              </div>
              <div className="rounded-lg bg-rose-50/60 border border-rose-100 p-2.5">
                <span className="block text-[11px] font-medium text-rose-800">Flagged Docs</span>
                <span className="mt-0.5 text-lg font-bold text-rose-900">
                  {application.flaggedDocsCount ?? 0}
                </span>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <Link
                href="/admin/verification"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563A8] hover:text-[#173F7A] hover:underline"
              >
                <span>Open Verification Desk</span>
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </section>

          {/* Section D: Deficiency Summary */}
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <div className="flex items-center justify-between border-b border-[#EEF1F5] pb-2.5 mb-3">
              <div className="flex items-center gap-2 font-semibold text-[#172033]">
                <AlertTriangle size={15} className="text-[#173F7A]" aria-hidden="true" />
                <h3>D. Deficiency Summary</h3>
              </div>
              <ApplicationStatusBadge type="deficiency" value={application.deficiencyStatus} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div>
                <span className="text-[11px] text-[#64748B]">Issue Count</span>
                <p className="font-semibold text-[#172033]">
                  {application.deficiencyIssueCount ?? (application.deficiencyStatus === 'None' ? 0 : 1)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Last Notice Date</span>
                <p className="font-semibold text-[#172033]">
                  {application.lastNoticeDate || 'No notice issued'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B]">Response Status</span>
                <p className="font-semibold text-[#172033]">
                  {application.deficiencyResponseStatus || 'Normal'}
                </p>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <Link
                href="/admin/deficiencies"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563A8] hover:text-[#173F7A] hover:underline"
              >
                <span>View Deficiency Queue</span>
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </section>

          {/* Section E: Workflow Timeline */}
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <div className="flex items-center gap-2 font-semibold text-[#172033] border-b border-[#EEF1F5] pb-2.5 mb-3">
              <Clock size={15} className="text-[#173F7A]" aria-hidden="true" />
              <h3>E. Workflow Timeline & Pipeline</h3>
            </div>

            <div className="space-y-4 pt-1">
              {WORKFLOW_STAGES_ORDER.map((step, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const isPending = idx > currentStageIndex;

                return (
                  <div key={step.stage} className="relative flex items-start gap-3">
                    {/* Connector line */}
                    {idx < WORKFLOW_STAGES_ORDER.length - 1 && (
                      <div
                        className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-[1px] ${
                          isCompleted ? 'bg-emerald-500' : 'bg-[#DCE3EC]'
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    {/* Icon circle */}
                    <div
                      className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : isCurrent
                          ? 'border-[#2563A8] bg-[#173F7A] text-white ring-4 ring-blue-100'
                          : 'border-[#DCE3EC] bg-slate-50 text-[#64748B]'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="min-w-0 flex-1 pb-2">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-semibold ${
                            isCurrent
                              ? 'text-[#173F7A]'
                              : isCompleted
                              ? 'text-[#172033]'
                              : 'text-[#64748B]'
                          }`}
                        >
                          {step.label}
                        </p>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800'
                              : isCurrent
                              ? 'bg-blue-50 text-blue-800 font-semibold'
                              : 'bg-slate-100 text-[#64748B]'
                          }`}
                        >
                          {isCompleted ? 'Completed' : isCurrent ? 'Active Stage' : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#64748B]">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section F: Recent Activity Log */}
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <div className="flex items-center gap-2 font-semibold text-[#172033] border-b border-[#EEF1F5] pb-2.5 mb-3">
              <History size={15} className="text-[#173F7A]" aria-hidden="true" />
              <h3>F. Recent Activity Log</h3>
            </div>

            <div className="space-y-3">
              {displayedActivities.map((act) => (
                <div
                  key={act.id}
                  className="rounded-lg border border-[#EEF1F5] bg-[#F8FAFC] p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#172033]">{act.activity}</span>
                    <span className="text-[10px] text-[#64748B]">{act.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">{act.details}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[#64748B] pt-0.5">
                    <span>Officer: <strong className="text-[#172033]">{act.actor}</strong></span>
                    <span>·</span>
                    <span>Role: {act.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-t border-[#DCE3EC] bg-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setShowFullDossier(!showFullDossier)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-xs font-semibold text-[#173F7A] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
          >
            <FileCode2 size={14} aria-hidden="true" />
            <span>{showFullDossier ? 'Hide Dossier' : 'View Full Application'}</span>
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/deficiencies"
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
            >
              <span>View Deficiencies</span>
            </Link>

            <Link
              href="/admin/verification"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#173F7A] bg-[#173F7A] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#173F7A]/90 focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
            >
              <span>Open Verification</span>
              <ExternalLink size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}