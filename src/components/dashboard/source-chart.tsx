'use client';

import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Report, Source } from '@/lib/types';

export function SourceChart({ reports, sources }: { reports: Report[], sources: Source[] }) {
  const sourceMap = React.useMemo(() => {
    return new Map(sources.map((s) => [s.id, s.name]));
  }, [sources]);

  const chartData = React.useMemo(() => {
    const sourceCounts = reports.reduce((acc, clipping) => {
      const sourceName = sourceMap.get(clipping.sourceId) || 'Unknown Source';
      acc[sourceName] = (acc[sourceName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sourceCounts).map(([source, count], index) => ({
      source,
      count,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));
  }, [reports, sourceMap]);

  const totalCount = React.useMemo(() => {
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
                      {totalCount.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Clippings
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

// Re-export from recharts because it's not in shadcn/ui
import { ResponsiveContainer } from 'recharts';
