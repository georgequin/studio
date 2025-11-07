'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { FirebaseClientProvider } from '@/firebase';
import { AuthGate } from '@/components/auth/auth-gate';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function AppSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex flex-col justify-between w-64 p-2 border-r bg-muted/20">
        <div>
            <div className="p-2 mb-4">
                <Skeleton className="h-8 w-3/4" />
            </div>
            <div className="flex flex-col gap-2 p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
        <div className="p-2">
            <Skeleton className="h-8 w-full" />
        </div>
      </div>
      {/* Main Content Skeleton */}
      <div className="flex-1 p-8">
        <Skeleton className="h-10 w-1/4 mb-8" />
        <div className="grid gap-8">
            <div className="grid lg:grid-cols-3 gap-8">
                <Skeleton className="h-96 lg:col-span-1" />
                <Skeleton className="h-96 lg:col-span-2" />
            </div>
        </div>
      </div>
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <FirebaseClientProvider>
        <AuthGate>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </AuthGate>
      </FirebaseClientProvider>
    </Suspense>
  );
}
