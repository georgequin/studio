'use client';

import * as React from 'react';
import { Label, Pie, PieChart, Sector } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Report } from '@/lib/types';

export function SourceChart({ data }: { data: Report[] }) {
    // This needs to be updated to resolve source names from sourceIds
  const chartData = React.useMemo(() => {
    const sourceCounts = data.reduce((acc, clipping) => {
      acc[clipping.sourceId] = (acc[clipping.sourceId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sourceCounts).map(([source, count], index) => ({
      source,
      count,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));
  }, [data]);

  const totalSources = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const chartConfig = chartData.reduce((acc, { source, fill }) => {
    acc[source] = { label: source, color: fill };
    return acc;
  }, {} as any);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="source"
            innerRadius="60%"
            strokeWidth={5}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold"
                      >
                        {totalSources.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        Sources
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// Re-export from recharts because it's not in shadcn/ui
import { ResponsiveContainer } from 'recharts';
