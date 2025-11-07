import { AppHeader } from '@/components/layout/app-header';
import { SourcesManager } from '@/components/settings/sources-manager';

export default function SettingsPage() {
  return (
    <div className="w-full">
      <AppHeader title="Settings" />
      <SourcesManager />
    </div>
  );
}
