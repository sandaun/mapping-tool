import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { OrchestratorProvider } from '@/contexts/OrchestratorContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Header />
      <OrchestratorProvider>
        <div className='flex-1 flex flex-col'>{children}</div>
      </OrchestratorProvider>
    </AppShell>
  );
}
