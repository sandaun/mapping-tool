'use client';

import { useTheme } from '@/hooks/useTheme';
import { SunIcon } from '@/components/icons/SunIcon';
import { MoonIcon } from '@/components/icons/MoonIcon';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo i títol */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xl text-primary-foreground shadow-sm">
            🔷
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Excel Protocol Mapping Tool
            </h1>
            <p className="text-xs text-muted-foreground">
              Industrial gateway configuration
            </p>
          </div>
        </div>

        {/* Toggle dark/light */}
        <div
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-full p-1.5 cursor-pointer transition-all duration-300"
          style={{
            background:
              theme === 'light'
                ? 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #f59e0b, #fbbf24) border-box'
                : theme === 'dark'
                ? 'linear-gradient(#1e293b, #1e293b) padding-box, linear-gradient(135deg, #0ea5e9, #06b6d4) border-box'
                : 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #e2e8f0, #cbd5e1) border-box',
            border: '2px solid transparent',
          }}
        >
          <SunIcon
            active={theme === 'light'}
            className="transition-opacity duration-300"
            style={{ opacity: theme === 'light' ? 1 : 0.3 }}
          />
          <MoonIcon
            active={theme === 'dark'}
            className="transition-opacity duration-300"
            style={{ opacity: theme === 'dark' ? 1 : 0.3 }}
          />
        </div>
      </div>
    </header>
  );
}
