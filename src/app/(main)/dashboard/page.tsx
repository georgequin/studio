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
import { FirebaseClientProvider } from '@/firebase';

export default function DashboardPage() {
  return (
    <div className="w-full">
      <AppHeader title="Dashboard" />
      <FirebaseClientProvider>
        <DashboardContent />
      </FirebaseClientProvider>
    </div>
  );
}

function DashboardContent() {
    // This component will be updated to fetch live data
    // For now, it will show loading or empty states
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Clippings</CardTitle>
            <CardDescription>Total articles processed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Distinct violation categories</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>News Sources</CardTitle>
            <CardDescription>Unique publications tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clippings by Category</CardTitle>
            <CardDescription>
              Distribution of processed articles across different categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryChart data={[]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clippings by Source</CardTitle>
            <CardDescription>
              Breakdown of articles from various news sources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SourceChart data={[]} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Clipping Frequency</CardTitle>
            <CardDescription>
              Volume of clippings processed over the last few months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FrequencyChart data={[]} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
