import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </AppShell>
  );
}
