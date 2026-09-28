'use client';

import { useState, useEffect } from 'react';

import { siteConfig } from '@/config/site';

interface MswProviderProps {
  children: React.ReactNode;
}

// ─── MSW Init Gate ────────────────────────────────────────────────────────────
// The app renders only after the MSW service worker is ready.
// In production (no MSW), this resolves immediately.

export function MswProvider({ children }: MswProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initMsw() {
      if (process.env.NODE_ENV === 'production') {
        setReady(true);
        return;
      }

      try {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: { url: '/mockServiceWorker.js' },
        });
      } catch (err) {
        console.warn('[MSW] Failed to start worker, falling back to passthrough:', err);
      } finally {
        setReady(true);
      }
    }

    initMsw();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-navy-gradient pattern-overlay">
        <div className="animate-pulse text-center">
          {/* Emblem placeholder */}
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/20" />
          <p className="text-lg font-semibold text-white">{siteConfig.appName}</p>
          <p className="mt-1 text-sm text-white/70">{siteConfig.ministryName}</p>
          <p className="mt-4 text-xs text-white/50">Initialising...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
