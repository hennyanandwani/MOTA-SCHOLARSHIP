'use client';

import { useEffect } from 'react';
import { useSessionStore, textSizePx } from '@/stores/session';

export function ThemeAndFontSizeProvider({ children }: { children: React.ReactNode }) {
  const { theme, textSize } = useSessionStore();

  useEffect(() => {
    const root = document.documentElement;

    // Apply theme
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply text size
    root.setAttribute('data-text-size', textSize);
    root.style.fontSize = `${textSizePx[textSize]}px`;
  }, [theme, textSize]);

  return <>{children}</>;
}
