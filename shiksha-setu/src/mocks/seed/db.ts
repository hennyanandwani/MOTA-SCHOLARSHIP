import { faker } from '@faker-js/faker';
import { openDB, type IDBPDatabase } from 'idb';

import type { Application, ApplicationDocument, User, ApplicantProfile, AuditEvent, Notification } from '@/types';
import { nfstScheme } from './nfst-scheme';
import { preMatricScheme } from './prematric-scheme';
import { postMatricScheme, topClassScheme, nosScheme, blankTemplateScheme } from './other-schemes';

// ─── Deterministic Seed ───────────────────────────────────────────────────────
// Numbers are illustrative and clearly marked.
faker.seed(26239);

export const ALL_SCHEMES = [nfstScheme, preMatricScheme, postMatricScheme, topClassScheme, nosScheme, blankTemplateScheme];

// ─── Indian Name Lists ────────────────────────────────────────────────────────
const firstNamesMale = ['Ravi', 'Suresh', 'Mahesh', 'Prakash', 'Rajesh', 'Dilip', 'Anil', 'Sanjay', 'Vijay', 'Ramesh', 'Arjun', 'Bikram', 'Chandrashekhar', 'Dinesh', 'Fagu'];
const firstNamesFemale = ['Sunita', 'Meena', 'Rekha', 'Anita', 'Geeta', 'Pushpa', 'Sarita', 'Laxmi', 'Priya', 'Kavita', 'Bimla', 'Champa', 'Dhani', 'Ekhya', 'Fulmati'];
const lastNames = ['Munda', 'Oraon', 'Ho', 'Santali', 'Gond', 'Bhil', 'Naga', 'Bodo', 'Kharia', 'Sora', 'Kondh', 'Sauria Paharia', 'Baiga', 'Korku', 'Halba'];
const states = ['Jharkhand', 'Odisha', 'Madhya Pradesh', 'Chhattisgarh', 'Rajasthan', 'Gujarat', 'Maharashtra', 'Assam', 'Manipur', 'Tripura'];
const districts = ['Ranchi', 'Sundargarh', 'Bastar', 'Jhabua', 'Sabarkantha', 'Gadchiroli', 'Karbi Anglong', 'Senapati', 'Khunti', 'Dantewada'];
const tribes = ['Munda', 'Oraon', 'Ho', 'Santali', 'Gond', 'Bhil', 'Naga', 'Bodo', 'Kharia', 'Sora'];

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── User & Profile Generators ─────────────────────────────────────────────────

function generateApplicant(idx: number, isMinor = false): { user: User; profile: ApplicantProfile } {
  const gender = idx % 3 === 0 ? 'female' : 'male';
  const firstName = gender === 'female' ? firstNamesFemale[idx % firstNamesFemale.length] : firstNamesMale[idx % firstNamesMale.length];
  const lastName = lastNames[idx % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const state = states[idx % states.length];
  const district = districts[idx % districts.length];
  const tribe = tribes[idx % tribes.length];
  const dob = isMinor
    ? faker.date.between({ from: '2010-01-01', to: '2015-12-31' }).toISOString().split('T')[0]
    : faker.date.between({ from: '1995-01-01', to: '2005-12-31' }).toISOString().split('T')[0];
  const mobile = `9${randInt(100000000, 999999999)}`;

  const user: User = {
    id: `usr-${idx.toString().padStart(4, '0')}`,
    name,
    mobile,
    role: 'student',
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    isActive: true,
  };

  const profile: ApplicantProfile = {
    userId: user.id,
    name,
    dob,
    gender: gender as 'male' | 'female',
    category: 'ST',
    tribe,
    mobile,
    aadhaarMasked: `XXXX-XXXX-${randInt(1000, 9999)}`,
    address: {
      line1: `${randInt(1, 100)} Tribal Colony`,
      village: `Village ${String.fromCharCode(65 + (idx % 26))}`,
      district,
      state,
      pincode: `${randInt(100000, 999999)}`,
    },
    annualFamilyIncome: randInt(30000, 600000),
    isMinor,
    guardianId: isMinor ? `grd-${idx}` : undefined,
  };

  return { user, profile };
}

// ─── Application Scenarios ────────────────────────────────────────────────────
// NOTE: These are ILLUSTRATIVE application scenarios for demo purposes.
// Real numbers come from the live database.

const schemeIds = ALL_SCHEMES.map((s) => s.id);

function generateApplication(
  idx: number,
  scenario: 'perfect' | 'deficiency' | 'low_ocr' | 'duplicate' | 'fake_institution' | 'rejected' | 'waitlisted' | 'selected_disbursed' | 'minor_guardian' | 'assisted'
): Application {
  const schemeId = schemeIds[idx % (schemeIds.length - 1)]; // skip template
  const scheme = ALL_SCHEMES.find((s) => s.id === schemeId)!;

  const statusMap: Record<typeof scenario, Application['status']> = {
    perfect: 'in_progress',
    deficiency: 'deficient',
    low_ocr: 'in_progress',
    duplicate: 'on_hold',
    fake_institution: 'on_hold',
    rejected: 'rejected',
    waitlisted: 'waitlisted',
    selected_disbursed: 'selected',
    minor_guardian: 'in_progress',
    assisted: 'in_progress',
  };

  const stageMap: Record<typeof scenario, string> = {
    perfect: 'state_screening',
    deficiency: 'deficient',
    low_ocr: 'institution_verification',
    duplicate: 'ministry_review',
    fake_institution: 'institution_verification',
    rejected: 'rejected',
    waitlisted: 'waitlisted',
    selected_disbursed: 'selected',
    minor_guardian: 'school_verification',
    assisted: 'submitted',
  };

  const stage = scheme.workflow.stages.find((s) => s.key === stageMap[scenario]) ?? scheme.workflow.stages[1];

  return {
    id: `app-${idx.toString().padStart(5, '0')}`,
    schemeId,
    schemeVersion: scheme.version.number,
    applicantId: `usr-${idx.toString().padStart(4, '0')}`,
    stageKey: stage.key,
    status: statusMap[scenario],
    triageLane: scenario === 'deficiency' || scenario === 'fake_institution' ? 'red' : scenario === 'low_ocr' ? 'amber' : 'green',
    formData: {
      fullName: `Applicant ${idx}`,
      tribe: tribes[idx % tribes.length],
      annualFamilyIncome: randInt(50000, 400000),
      gender: idx % 3 === 0 ? 'female' : 'male',
      institutionCode: scenario === 'fake_institution' ? 'FAKE001' : `INST${randInt(1000, 9999)}`,
    },
    score: scenario === 'selected_disbursed' ? randInt(75, 95) : undefined,
    rank: scenario === 'selected_disbursed' ? randInt(1, 200) : undefined,
    submittedAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    slaDeadline: stage.slaDays > 0 ? new Date(Date.now() + stage.slaDays * 86400000 * (Math.random() * 2 - 0.5)).toISOString() : undefined,
    isAssistedMode: scenario === 'assisted',
    assistedBy: scenario === 'assisted' ? 'operator-001' : undefined,
    guardianId: scenario === 'minor_guardian' ? `grd-${idx}` : undefined,
  };
}

// ─── Database ─────────────────────────────────────────────────────────────────

export interface MockDB {
  schemes: typeof ALL_SCHEMES;
  users: User[];
  profiles: ApplicantProfile[];
  applications: Application[];
  auditEvents: AuditEvent[];
  notifications: Notification[];
}

let _db: IDBPDatabase | null = null;

async function getDB() {
  if (_db) return _db;
  _db = await openDB('shiksha-setu-mock', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
    },
  });
  return _db;
}

export async function loadDB(): Promise<MockDB> {
  try {
    const db = await getDB();
    const stored = await db.get('data', 'mockdb');
    if (stored) return stored as MockDB;
  } catch {
    // IndexedDB unavailable (SSR context), fallback to memory
  }
  return generateSeedData();
}

export async function saveDB(data: MockDB): Promise<void> {
  try {
    const db = await getDB();
    await db.put('data', data, 'mockdb');
  } catch {
    // ignore in SSR
  }
}

export async function resetDB(): Promise<MockDB> {
  try {
    const db = await getDB();
    await db.delete('data', 'mockdb');
  } catch {}
  return loadDB();
}

function generateSeedData(): MockDB {
  // NOTE: ~200 illustrative applications for demo. Not real data.
  const users: User[] = [];
  const profiles: ApplicantProfile[] = [];
  const applications: Application[] = [];

  const scenarios: Application['status'][] = ['in_progress', 'deficient', 'in_progress', 'on_hold', 'on_hold', 'rejected', 'waitlisted', 'selected', 'in_progress', 'in_progress'];
  const scenarioKeys = ['perfect', 'deficiency', 'low_ocr', 'duplicate', 'fake_institution', 'rejected', 'waitlisted', 'selected_disbursed', 'minor_guardian', 'assisted'] as const;

  for (let i = 0; i < 200; i++) {
    const isMinor = i % 20 === 8; // scenario minor_guardian
    const { user, profile } = generateApplicant(i, isMinor);
    users.push(user);
    profiles.push(profile);

    const scenarioKey = scenarioKeys[i % scenarioKeys.length];
    applications.push(generateApplication(i, scenarioKey));
  }

  const notifications: Notification[] = users.slice(0, 10).map((u, i) => ({
    id: `notif-${i}`,
    userId: u.id,
    title: { en: 'Application Update', hi: 'आवेदन अपडेट' },
    body: { en: 'Your application status has been updated.', hi: 'आपके आवेदन की स्थिति अपडेट की गई है।' },
    type: 'info' as const,
    channel: 'in_app' as const,
    read: i > 3,
    createdAt: faker.date.recent({ days: 7 }).toISOString(),
  }));

  return {
    schemes: ALL_SCHEMES,
    users,
    profiles,
    applications,
    auditEvents: [],
    notifications,
  };
}

// Initialize DB on first load
let dbInstance: MockDB | null = null;

export async function getDb(): Promise<MockDB> {
  if (!dbInstance) {
    dbInstance = await loadDB();
  }
  return dbInstance;
}

export async function persistDb(db: MockDB): Promise<void> {
  dbInstance = db;
  await saveDB(db);
}
