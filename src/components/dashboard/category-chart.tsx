'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Report } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/thematic-areas';

export function CategoryChart({ data }: { data: Report[] }) {
  const chartData = React.useMemo(() => {
    const categoryCounts = data.reduce((acc, clipping) => {
      const category = clipping.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      fill: CATEGORY_COLORS[category] || 'hsl(var(--muted))',
    }));
  }, [data]);

  const chartConfig = {
    count: {
      label: 'Count',
    },
    ...chartData.reduce((acc, item) => {
      acc[item.category] = {
        label: item.category,
        color: item.fill,
      };
      return acc;
    }, {} as any)
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
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
            radius={5}
            background={{ fill: 'hsl(var(--muted))', radius: 5 }}
          >
            {chartData.map((entry) => (
                <Bar key={entry.category} dataKey="count" fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
