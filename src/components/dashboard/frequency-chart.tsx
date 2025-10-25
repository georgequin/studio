'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Clipping } from '@/lib/data';

export function FrequencyChart({ data }: { data: Clipping[] }) {
  const chartData = React.useMemo(() => {
    const monthCounts = data.reduce((acc, clipping) => {
      const month = format(new Date(clipping.date), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthCounts)
      .map(([month, count]) => ({
        month,
        count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  const chartConfig = {
    count: {
      label: 'Clippings',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => format(new Date(`${value}-01`), 'MMM yyyy')}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Area
            dataKey="count"
            type="natural"
            fill="var(--color-count)"
            fillOpacity={0.4}
            stroke="var(--color-count)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
