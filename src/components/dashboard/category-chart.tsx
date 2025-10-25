'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Clipping } from '@/lib/data';

export function CategoryChart({ data }: { data: Clipping[] }) {
  const chartData = React.useMemo(() => {
    const categoryCounts = data.reduce((acc, clipping) => {
      acc[clipping.category] = (acc[clipping.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));
  }, [data]);

  const chartConfig = {
    count: {
      label: 'Count',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{ left: 10, right: 10 }}
        >
          <YAxis
            dataKey="category"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            className="text-xs"
            interval={0}
            width={130}
          />
          <XAxis dataKey="count" type="number" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={5}
            background={{ fill: 'hsl(var(--muted))', radius: 5 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
