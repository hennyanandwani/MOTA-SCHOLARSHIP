// ─── Integration Adapters ─────────────────────────────────────────────────────
// These are interfaces + mock implementations.
// No component may import mock implementations directly — use via providers.

import { sleep, randomBetween } from '@/lib/utils';

// ─── Demo Flags ───────────────────────────────────────────────────────────────

type DigiLockerState = 'ok' | 'denied' | 'timeout' | 'unavailable';

export interface DemoFlags {
  digilocker: DigiLockerState;
  institution: 'ok' | 'unavailable';
  payment: 'ok' | 'failed';
  translateLatency: number; // ms
}

export const defaultDemoFlags: DemoFlags = {
  digilocker: 'ok',
  institution: 'ok',
  payment: 'ok',
  translateLatency: 500,
};

// ─── Document Source Adapter ──────────────────────────────────────────────────

export interface IssuedDocument {
  id: string;
  type: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  name: string;
}

export interface FetchedDocument {
  file: Blob;
  fields: Record<string, string>;
  issuer: string;
  fetchedAt: string;
  hash: string;
}

export interface DocumentSourceAdapter {
  getConsentRequest(): Promise<{ url: string; token: string }>;
  link(consentToken: string): Promise<{ linked: boolean }>;
  revoke(): Promise<void>;
  listIssuedDocuments(): Promise<IssuedDocument[]>;
  fetchDocument(id: string): Promise<FetchedDocument>;
}

export class MockDocumentSourceAdapter implements DocumentSourceAdapter {
  constructor(private flags: DemoFlags = defaultDemoFlags) {}

  private async latency() {
    await sleep(randomBetween(300, 1200));
  }

  async getConsentRequest() {
    await this.latency();
    if (this.flags.digilocker === 'unavailable') throw new Error('DigiLocker unavailable');
    if (this.flags.digilocker === 'timeout') {
      await sleep(10000);
      throw new Error('Timeout');
    }
    return {
      url: 'https://digilocker.example.gov.in/consent?token=demo-token',
      token: 'demo-consent-token',
    };
  }

  async link(consentToken: string) {
    await this.latency();
    if (this.flags.digilocker === 'denied') {
      throw new Error('User denied consent');
    }
    return { linked: true };
  }

  async revoke() {
    await this.latency();
  }

  async listIssuedDocuments(): Promise<IssuedDocument[]> {
    await this.latency();
    if (this.flags.digilocker !== 'ok') throw new Error('DigiLocker not connected');
    return [
      {
        id: 'dl-001',
        type: 'income_certificate',
        issuer: 'District Administration',
        issuedAt: '2024-04-01',
        expiresAt: '2025-03-31',
        name: 'Income Certificate',
      },
      {
        id: 'dl-002',
        type: 'caste_certificate',
        issuer: 'Revenue Department',
        issuedAt: '2023-11-15',
        name: 'Caste Certificate',
      },
      {
        id: 'dl-003',
        type: 'aadhaar',
        issuer: 'UIDAI',
        issuedAt: '2020-01-01',
        name: 'Aadhaar Card',
      },
    ];
  }

  async fetchDocument(id: string): Promise<FetchedDocument> {
    await this.latency();
    return {
      file: new Blob(['[mock pdf content]'], { type: 'application/pdf' }),
      fields: {
        name: 'Ravi Kumar Munda',
        dob: '2005-06-15',
        income: '85000',
        caste: 'Munda',
      },
      issuer: 'District Administration, Ranchi',
      fetchedAt: new Date().toISOString(),
      hash: `sha256-mock-${id}`,
    };
  }
}

// ─── Institution Adapter ──────────────────────────────────────────────────────

export interface InstitutionInfo {
  registered: boolean;
  name?: string;
  type?: string;
  district?: string;
  state?: string;
  source: string;
  flags: string[];
}

export interface InstitutionAdapter {
  verify(instituteCode: string): Promise<InstitutionInfo>;
}

export class MockInstitutionAdapter implements InstitutionAdapter {
  constructor(private flags: DemoFlags = defaultDemoFlags) {}

  async verify(instituteCode: string): Promise<InstitutionInfo> {
    await sleep(randomBetween(300, 800));
    if (this.flags.institution === 'unavailable') throw new Error('Institution registry unavailable');

    // Simulate fake institution for demo
    if (instituteCode === 'FAKE001') {
      return {
        registered: false,
        source: 'AISHE',
        flags: ['unrecognised', 'potential_fraud'],
      };
    }

    return {
      registered: true,
      name: `Demo College (${instituteCode})`,
      type: 'degree_college',
      district: 'Ranchi',
      state: 'Jharkhand',
      source: 'AISHE',
      flags: [],
    };
  }
}

// ─── Identity Adapter ─────────────────────────────────────────────────────────

export interface MaskedIdentity {
  maskedAadhaar: string; // XXXX-XXXX-1234 format, never full
  name: string;
  dob: string;
}

export interface IdentityAdapter {
  getMaskedIdentity(): Promise<MaskedIdentity>;
}

export class MockIdentityAdapter implements IdentityAdapter {
  async getMaskedIdentity(): Promise<MaskedIdentity> {
    await sleep(randomBetween(300, 600));
    return {
      maskedAadhaar: 'XXXX-XXXX-3456', // Never returns full Aadhaar
      name: 'Ravi Kumar Munda',
      dob: '2005-06-15',
    };
  }
}

// ─── Payment Adapter ──────────────────────────────────────────────────────────

export interface PaymentTimeline {
  sanctionId: string;
  events: Array<{ date: string; event: string; amount?: number }>;
}

export interface PaymentAdapter {
  getPaymentStatus(sanctionId: string): Promise<{ status: string; amount: number; utr?: string }>;
  getTimeline(sanctionId: string): Promise<PaymentTimeline>;
}

export class MockPaymentAdapter implements PaymentAdapter {
  constructor(private flags: DemoFlags = defaultDemoFlags) {}

  async getPaymentStatus(sanctionId: string) {
    await sleep(randomBetween(300, 800));
    if (this.flags.payment === 'failed') throw new Error('Payment gateway unavailable');
    return {
      status: 'paid',
      amount: 25000,
      utr: `UTR${Date.now()}`,
    };
  }

  async getTimeline(sanctionId: string): Promise<PaymentTimeline> {
    await sleep(randomBetween(300, 600));
    return {
      sanctionId,
      events: [
        { date: '2024-08-01', event: 'Sanction issued', amount: 25000 },
        { date: '2024-08-05', event: 'Payment initiated', amount: 25000 },
        { date: '2024-08-07', event: 'Payment credited', amount: 25000 },
      ],
    };
  }
}

// ─── Notify Adapter ───────────────────────────────────────────────────────────

export interface NotifyPreview {
  channel: 'sms' | 'email' | 'whatsapp';
  rendered: string;
}

export interface NotifyAdapter {
  preview(
    channel: 'sms' | 'email' | 'whatsapp',
    template: string,
    vars: Record<string, string>
  ): Promise<NotifyPreview>;
}

export class MockNotifyAdapter implements NotifyAdapter {
  async preview(
    channel: 'sms' | 'email' | 'whatsapp',
    template: string,
    vars: Record<string, string>
  ): Promise<NotifyPreview> {
    await sleep(200);
    let rendered = template;
    for (const [key, value] of Object.entries(vars)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return { channel, rendered };
  }
}

// ─── Translate Adapter ────────────────────────────────────────────────────────

export interface TranslateAdapter {
  translate(text: string, toLocale: string): Promise<string>;
  readAloud(text: string, locale: string): Promise<void>;
}

export class MockTranslateAdapter implements TranslateAdapter {
  constructor(private flags: DemoFlags = defaultDemoFlags) {}

  async translate(text: string, toLocale: string): Promise<string> {
    await sleep(this.flags.translateLatency);
    // Mock: just append locale marker
    return `[${toLocale}] ${text}`;
  }

  async readAloud(text: string, locale: string): Promise<void> {
    // Mock: use browser TTS if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale === 'hi' ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  }
}
