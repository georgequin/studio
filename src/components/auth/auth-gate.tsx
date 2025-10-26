'use client';

import * as React from 'react';
import { useAuth, useUser } from '@/firebase/provider';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { LoaderCircle } from 'lucide-react';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return <>{children}</>;
}