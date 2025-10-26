import { AppHeader } from '@/components/layout/app-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { CategoryChart } from '@/components/dashboard/category-chart';
import { SourceChart } from '@/components/dashboard/source-chart';
import { FrequencyChart } from '@/components/dashboard/frequency-chart';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default function DashboardPage() {
  return (
    <div className="w-full">
      <AppHeader title="Dashboard" />
      <DashboardContent />
    </div>
  );
}
