import { AppHeader } from '@/components/layout/app-header';
import { ReportsTable } from '@/components/reports/reports-table';
import { mockData } from '@/lib/data';
import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="w-full">
      <AppHeader title="Reports">
        {/* The export functionality is in the client component */}
      </AppHeader>
      <ReportsTable data={mockData} />
    </div>
  );
}
