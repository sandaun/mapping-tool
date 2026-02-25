'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import Image from 'next/image';
import { ThemeToggleIcon } from './icons/ThemeToggle';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg text-primary-foreground">
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
            <h1 className="text-lg font-bold text-foreground">SIGNAL AI</h1>
            <p className="text-xs text-muted-foreground">
              Gateweay Mapping Engine
            </p>
          </div>
        </div>

        {/* Right side: user info + theme toggle */}
        <div className="flex items-center gap-3">
          {userEmail && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-muted-foreground max-w-40 truncate">
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Toggle dark/light */}
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
            // Change the icon color according to the theme (inherited via currentColor in SVG)
            color: theme === 'dark' ? '#0ea5e9' : '#f59e0b',
          }}
        >
          <ThemeToggleIcon theme={theme} />
          </div>
        </div>
      </div>
    </header>
  );
}
