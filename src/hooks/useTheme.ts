'use client';

import { useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'mapping-tool-theme';
const DEFAULT_THEME: Theme = 'light';

/**
 * Get theme from localStorage or return default.
 * Returns undefined during SSR.
 */
function getThemeSnapshot(): Theme | undefined {
  if (typeof window === 'undefined') return undefined;
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return stored ?? DEFAULT_THEME;
}

/**
 * Subscribe to localStorage changes (for cross-tab synchronization).
 */
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

/**
 * Custom hook for managing theme state with localStorage persistence.
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Applies theme via .dark class on <html> element
 * - SSR-safe with useSyncExternalStore
 * - Cross-tab synchronization
 */
export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    () => undefined // SSR snapshot
  );

  // Sync DOM with theme state
  useEffect(() => {
    if (!theme) return;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    if (!theme) return;

    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);

    // Trigger re-render by dispatching storage event
    window.dispatchEvent(new Event('storage'));
  };

  return { theme, toggleTheme };
}
