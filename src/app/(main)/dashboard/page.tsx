import { AppHeader } from '@/components/layout/app-header';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default function DashboardPage() {
  return (
    <div className="w-full">
      <AppHeader title="Dashboard" />
      <DashboardContent />
    </div>
  );
}
