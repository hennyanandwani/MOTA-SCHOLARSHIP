import fs from ''fs'';
import path from ''path'';

const files = {
  ''components/admin/verification/VerificationCard.tsx'': `import React from ''react'';
import { VerificationStatusBadge, AIMatchBadge, PriorityBadge } from ''./VerificationStatusBadge'';
import type { VerificationRecord } from ''@/lib/adminVerificationData'';

export function VerificationCard({ record, onReview }: { record: VerificationRecord; onReview: () => void }) {
  return (
    <div className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] space-y-3">
      <div className="flex justify-between items-start">
        <div className="text-xs font-semibold text-[#172033]">{record.applicationId}</div>
        <PriorityBadge priority={record.priority} />
      </div>
      <div className="text-sm font-medium text-[#172033]">{record.applicantName}</div>
      <div className="text-[11px] text-[#64748B]">{record.documentName}</div>
      <div className="flex gap-2 items-center">
        <AIMatchBadge status={record.aiMatch} />
        <VerificationStatusBadge status={record.verificationStatus} />
      </div>
      <button onClick={onReview} className="w-full mt-2 rounded-lg bg-[#173F7A] text-white py-2 text-xs font-semibold">Review</button>
    </div>
  );
}`,
  ''app/admin/verification/page.tsx'': `import { AdminVerificationPageClient } from ''@/components/admin/verification/VerificationPageClient'';
import { getInitialVerificationRecords } from ''@/lib/adminVerificationData'';
import { Sidebar } from ''@/components/layout/Sidebar'';
import { Topbar } from ''@/components/layout/Topbar'';
import { adminNavigation } from ''@/lib/navigation'';

export default function VerificationPage() {
  const records = getInitialVerificationRecords();
  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar role="MoTA Administration" context="admin" />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <AdminVerificationPageClient initialRecords={records} />
      </main>
    </div>
  );
}`
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.resolve(''d:/Code/SIH Hackathone/SIH239/ps26239-starter'', filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log(''Created: '', fullPath);
}
