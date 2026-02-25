'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Settings, LogOut, Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const APP_VERSION = '0.1.0';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className={`
        shrink-0 h-screen sticky top-0
        flex flex-col
        border-r border-border bg-card/95 backdrop-blur-sm
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-14' : 'w-52'}
      `}
    >
      {/* Toggle — fixed hamburger icon exactly centered within the w-14 */}
      <div className="flex items-center px-[12px] py-3 border-b border-border h-[64px]">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-8 h-8 shrink-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-2 flex-1 overflow-hidden">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`
                flex items-center h-10 px-3 gap-3 rounded-md
                transition-colors overflow-hidden whitespace-nowrap
                ${
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
              `}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span
                className={`
                  text-sm font-medium
                  transition-opacity duration-300
                  ${collapsed ? 'opacity-0' : 'opacity-100'}
                `}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: sign out + version */}
      <div className="flex flex-col gap-1 p-2 border-t border-border overflow-hidden">
        <button
          onClick={handleLogout}
          className="flex items-center h-10 px-3 gap-3 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors overflow-hidden whitespace-nowrap"
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span
            className={`
              text-sm font-medium
              transition-opacity duration-300
              ${collapsed ? 'opacity-0' : 'opacity-100'}
            `}
          >
            Sign out
          </span>
        </button>

        {/* Version absolute position to stay exactly below no matter what */}
        <p
          className={`
            px-3 py-1 text-xs font-mono text-muted-foreground/50 whitespace-nowrap
            transition-opacity duration-300
            ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
        >
          v{APP_VERSION}
        </p>
      </div>
    </aside>
  );
}
