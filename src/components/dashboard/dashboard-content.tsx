'use client';
import * as React from 'react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Report } from '@/lib/types';
import type { Source } from '@/lib/types';

export function DashboardContent() {
  const firestore = useFirestore();

  const reportsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'reports');
  }, [firestore]);
  const { data: reports, isLoading: reportsLoading } =
    useCollection<Report>(reportsCollection);

  const sourcesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sources');
  }, [firestore]);
  const { data: sources, isLoading: sourcesLoading } =
    useCollection<Source>(sourcesCollection);

  const totalClippings = reports?.length || 0;
  const totalCategories = reports
    ? new Set(reports.map((r) => r.category)).size
    : 0;
  const totalSources = sources?.length || 0;
  
  const isLoading = reportsLoading || sourcesLoading;

  return (
    <div className="grid gap-8 p-4 md:p-6 lg:p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Clippings</CardTitle>
            <CardDescription>Total articles processed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{isLoading ? '...' : totalClippings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Distinct violation categories</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{isLoading ? '...' : totalCategories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>News Sources</CardTitle>
            <CardDescription>Unique publications tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{isLoading ? '...' : totalSources}</p>
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
            <CategoryChart data={reports || []} />
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
            <SourceChart reports={reports || []} sources={sources || []} />
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
            <FrequencyChart data={reports || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
