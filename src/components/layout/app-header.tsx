'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        {children}
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
      </div>
    </header>
  );
}
