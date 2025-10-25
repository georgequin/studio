import { AppHeader } from '@/components/layout/app-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { mockData } from '@/lib/data';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { SourceChart } from '@/components/dashboard/source-chart';
import { FrequencyChart } from '@/components/dashboard/frequency-chart';

export default function DashboardPage() {
  const totalClippings = mockData.length;
  const categories = [...new Set(mockData.map((d) => d.category))];
  const totalCategories = categories.length;
  const sources = [...new Set(mockData.map((d) => d.source))];
  const totalSources = sources.length;

  return (
    <div className="w-full">
      <AppHeader title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Clippings</CardTitle>
            <CardDescription>Total articles processed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalClippings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Distinct violation categories</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalCategories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>News Sources</CardTitle>
            <CardDescription>Unique publications tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalSources}</p>
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
            <CategoryChart data={mockData} />
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
            <SourceChart data={mockData} />
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
            <FrequencyChart data={mockData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
