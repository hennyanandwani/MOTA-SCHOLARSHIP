'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

export function SchemeSaveButton() {
  const [isSaved, setIsSaved] = useState(false);
  const Icon = isSaved ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      onClick={() => setIsSaved((saved) => !saved)}
      aria-pressed={isSaved}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-4 text-sm font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2 sm:w-auto"
    >
      <Icon size={16} aria-hidden="true" />
      {isSaved ? 'Saved Scheme' : 'Save Scheme'}
    </button>
  );
}