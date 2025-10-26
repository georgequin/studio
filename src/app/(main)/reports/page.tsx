import { AppHeader } from '@/components/layout/app-header';
import { ReportsTable } from '@/components/reports/reports-table';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function ReportsPage() {
  return (
    <div className="w-full">
      <AppHeader title="Reports">
        {/* The export functionality is in the client component */}
      </AppHeader>
      <FirebaseClientProvider>
        <ReportsTable />
      </FirebaseClientProvider>
    </div>
  );
}
