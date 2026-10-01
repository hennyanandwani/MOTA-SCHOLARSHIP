export interface SupportRequest {
  id: string;
  category: string;
  subject: string;
  description: string;
  applicationId?: string;
  status: 'submitted' | 'resolved';
  createdAt: string;
}

export interface SupportDraft {
  category: string;
  subject: string;
  description: string;
  applicationId: string;
  lastSaved?: string;
}

export const SUPPORT_CATEGORIES = [
  'Application',
  'Document',
  'Eligibility',
  'Account',
  'Technical issue',
  'Other',
] as const;

export type SupportCategory = typeof SUPPORT_CATEGORIES[number];

const STORAGE_KEY_REQUESTS = 'mota_student_support_requests';
const STORAGE_KEY_DRAFT = 'mota_support_draft';
const STORAGE_KEY_HISTORY = 'mota_help_recent_history';

const initialDemoRequests: SupportRequest[] = [
  {
    id: 'SUP-2026-481920',
    category: 'Document',
    subject: 'Income Certificate clarification for NFST',
    description: 'I need guidance regarding the valid issuing authority for the income certificate under National Fellowship for ST Students.',
    applicationId: 'NFST-2026-90412',
    status: 'submitted',
    createdAt: '2026-09-28T10:30:00.000Z',
  },
];

function isWindowAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getSupportRequests(): SupportRequest[] {
  if (!isWindowAvailable()) return initialDemoRequests;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (!stored) {
      // Initialize with default demo requests
      window.localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(initialDemoRequests));
      return initialDemoRequests;
    }

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter(isValidSupportRequest);
    }
    return initialDemoRequests;
  } catch {
    return initialDemoRequests;
  }
}

export function saveSupportRequest(data: {
  category: string;
  subject: string;
  description: string;
  applicationId?: string;
}): SupportRequest {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const newRequest: SupportRequest = {
    id: `SUP-2026-${randomSuffix}`,
    category: data.category.trim() || 'General',
    subject: data.subject.trim(),
    description: data.description.trim(),
    applicationId: data.applicationId?.trim() || undefined,
    status: 'submitted',
    createdAt: new Date().toISOString(),
  };

  if (!isWindowAvailable()) return newRequest;

  try {
    const current = getSupportRequests();
    const updated = [newRequest, ...current];
    window.localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
  } catch {
    // Storage full or restricted
  }

  return newRequest;
}

export function updateSupportRequestStatus(id: string, status: 'submitted' | 'resolved'): SupportRequest | null {
  if (!isWindowAvailable()) return null;

  try {
    const current = getSupportRequests();
    let targetRequest: SupportRequest | null = null;
    const updated = current.map((req) => {
      if (req.id === id) {
        targetRequest = { ...req, status };
        return targetRequest;
      }
      return req;
    });

    if (targetRequest) {
      window.localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
    }
    return targetRequest;
  } catch {
    return null;
  }
}

export function deleteSupportRequest(id: string): boolean {
  if (!isWindowAvailable()) return false;

  try {
    const current = getSupportRequests();
    const filtered = current.filter((req) => req.id !== id);
    window.localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

export function clearSupportRequests(): void {
  if (!isWindowAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify([]));
  } catch {
    // Ignore storage errors
  }
}

export function getSupportDraft(): SupportDraft | null {
  if (!isWindowAvailable()) return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_DRAFT);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object' && typeof parsed.subject === 'string') {
      return parsed as SupportDraft;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSupportDraft(draft: SupportDraft): void {
  if (!isWindowAvailable()) return;

  try {
    const payload: SupportDraft = {
      ...draft,
      lastSaved: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(payload));
  } catch {
    // Ignore storage errors
  }
}

export function clearSupportDraft(): void {
  if (!isWindowAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_DRAFT);
  } catch {
    // Ignore storage errors
  }
}

export function getRecentHelpHistory(): string[] {
  if (!isWindowAvailable()) return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string').slice(0, 5);
    }
    return [];
  } catch {
    return [];
  }
}

export function addRecentHelpHistory(topicId: string): string[] {
  if (!isWindowAvailable() || !topicId) return [];

  try {
    const current = getRecentHelpHistory();
    const filtered = current.filter((id) => id !== topicId);
    const updated = [topicId, ...filtered].slice(0, 5);
    window.localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearRecentHelpHistory(): void {
  if (!isWindowAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch {
    // Ignore storage errors
  }
}

function isValidSupportRequest(obj: unknown): obj is SupportRequest {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.subject === 'string' &&
    typeof candidate.description === 'string' &&
    (candidate.status === 'submitted' || candidate.status === 'resolved') &&
    typeof candidate.createdAt === 'string'
  );
}