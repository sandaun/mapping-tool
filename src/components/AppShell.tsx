'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex flex-1">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-1 flex-col min-w-0">{children}</div>
    </div>
  );
}
