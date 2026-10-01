import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Application } from '@/lib/applicationTracking';
import { ApplicationActivity, CommunicationCard } from '@/components/student/application-status/ApplicationActivity';
import { ApplicationProgress } from '@/components/student/application-status/ApplicationProgress';
import { ApplicationStatusHeader } from '@/components/student/application-status/ApplicationStatusHeader';
import { ApplicationSummary } from '@/components/student/application-status/ApplicationSummary';
import { ApplicationTimeline } from '@/components/student/application-status/ApplicationTimeline';
import { ActionRequired, NextSteps, SupportCard } from '@/components/student/application-status/ApplicationExtras';
import { DocumentStatusSummary } from '@/components/student/application-status/DocumentStatusSummary';

const buttonBase = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';

export function ApplicationStatusPage({ application }: { application: Application }) {
  const documentsHref = `/student/schemes/${application.schemeId}/apply/documents`;
  const schemeHref = `/student/schemes/${application.schemeId}`;
  const attentionDocument = application.documents.find((document) => document.status === 'Needs Attention');

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <ApplicationStatusHeader application={application} />
      <ApplicationProgress application={application} />

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <ApplicationTimeline stages={application.stages} />
        <DocumentStatusSummary application={application} documentsHref={documentsHref} />
      </div>

      {attentionDocument && <ActionRequired document={attentionDocument} documentsHref={documentsHref} />}

      <ApplicationSummary application={application} />

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
        <ApplicationActivity events={application.activity} />
        <CommunicationCard communications={application.communications} />
      </div>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
        <NextSteps />
        <SupportCard />
      </div>

      <nav aria-label="Application actions" className="grid gap-2 border-t border-[#DCE3EC] pt-4 sm:flex sm:justify-between">
        <Link href="/student/applications" className={`${buttonBase} w-full border border-[#B8C9DC] bg-white text-[#173F7A] hover:bg-blue-50 sm:w-auto`}><ArrowLeft size={15} aria-hidden="true" />Back to My Applications</Link>
        <Link href={schemeHref} className={`${buttonBase} w-full bg-[#173F7A] text-white hover:bg-[#123365] sm:w-auto`}>View Scheme Details<ArrowRight size={15} aria-hidden="true" /></Link>
      </nav>

      <p className="border-t border-[#DCE3EC] pt-3 text-[10px] leading-4 text-[#64748B]">Status details are illustrative demo data. Final eligibility and selection are determined through official verification and the applicable scheme process.</p>
    </div>
  );
}