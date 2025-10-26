import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { FirebaseClientProvider } from '@/firebase';
import { AuthGate } from '@/components/auth/auth-gate';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthGate>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </AuthGate>
    </FirebaseClientProvider>
  );
}