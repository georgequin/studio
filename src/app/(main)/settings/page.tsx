import { AppHeader } from '@/components/layout/app-header';
import { SourcesManager } from '@/components/settings/sources-manager';
import { FirebaseClientProvider } from '@/firebase';

export default function SettingsPage() {
  return (
    <div className="w-full">
      <AppHeader title="Settings" />
      <FirebaseClientProvider>
        <SourcesManager />
      </FirebaseClientProvider>
    </div>
  );
}
