'use client';

import { useTheme } from '@/hooks/useTheme';
import Image from 'next/image';
import { ThemeToggleIcon } from './icons/ThemeToggle';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg">
            <Image
              src="/LogoSignal.svg"
              alt="Logo"
              width={223}
              height={100}
              className="h-8 w-auto"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold font-space tracking-wide text-foreground leading-none">
              SIGNAL A
              <span className="inline-block bg-linear-to-b from-[#f59e0b] to-[#ea580c] bg-clip-text text-transparent">
                I
              </span>
            </h1>
            <p className="text-xs text-muted-foreground tracking-wide">
              Gateway Mapping Engine
            </p>
          </div>
        </div>

        {/* Right side: theme toggle */}
        <div
          onClick={toggleTheme}
          className="flex items-center justify-center rounded-full p-2 cursor-pointer transition-all duration-300"
          style={{
            background:
              theme === 'light'
                ? 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #f59e0b, #fbbf24) border-box'
                : theme === 'dark'
                  ? 'linear-gradient(#1e293b, #1e293b) padding-box, linear-gradient(135deg, #0ea5e9, #06b6d4) border-box'
                  : 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #e2e8f0, #cbd5e1) border-box',
            border: '1px solid transparent',
            color: theme === 'dark' ? '#0ea5e9' : '#f59e0b',
          }}
        >
          <ThemeToggleIcon theme={theme} />
        </div>
      </div>
    </header>
  );
}
