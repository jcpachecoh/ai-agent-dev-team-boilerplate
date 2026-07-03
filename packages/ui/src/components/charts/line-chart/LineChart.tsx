import * as React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartContainer } from '../shared/ChartContainer';
import { ChartLegend } from '../shared/ChartLegend';
import { ChartTooltip } from '../shared/ChartTooltip';
import { getSeriesColor } from '../shared/chart-colors';
import { getChartTheme } from '../shared/chart-theme';
import { formatNumberCompact } from '../shared/format-number';
import type { ChartBaseProps, ChartValueType } from '../shared/types';
import styles from './LineChart.module.scss';

export interface LineChartSeries {
  dataKey: string;
  name: string;
  colorIndex?: number;
}

export interface LineChartReferenceLine {
  value: number;
  label?: string;
}

export interface LineChartProps extends ChartBaseProps {
  data: Array<Record<string, string | number>>;
  xDataKey: string;
  series: LineChartSeries[];
  valueType?: ChartValueType;
  referenceLine?: LineChartReferenceLine;
  showLegend?: boolean;
  height?: number;
  xAxisInterval?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xDataKey,
  series,
  valueType = 'number',
  referenceLine,
  showLegend = true,
  height,
  xAxisInterval = 0,
  theme = 'light',
  size = 'md',
  loading = false,
  empty,
  emptyTitle,
  emptyDescription,
  ariaLabel = 'Line chart',
  className,
}) => {
  const [hiddenKeys, setHiddenKeys] = React.useState<Set<string>>(new Set());
  const chartTheme = getChartTheme(theme);
  const isEmpty = empty ?? data.length === 0;

  const visibleSeries = series.filter((s) => !hiddenKeys.has(s.dataKey));

  const legendSeries = series.map((s, i) => ({
    key: s.dataKey,
    name: s.name,
    color: getSeriesColor(s.colorIndex ?? i),
  }));

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const toggleSeries = (key: string): void => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tickFormatter = (v: number): string =>
    valueType === 'currency' ? formatNumberCompact(v) : formatNumberCompact(v);

  const plotHeight = height ?? (size === 'xl' ? 240 : size === 'sm' ? 140 : 180);

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <ChartContainer
        theme={theme}
        size={size}
        loading={loading}
        empty={isEmpty}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        ariaLabel={ariaLabel}
        height={plotHeight}
        className={styles.plot}
      >
        <ResponsiveContainer width="100%" height={plotHeight}>
          <RechartsLineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={xDataKey}
              interval={xAxisInterval}
              tick={{ fill: chartTheme.axis, fontSize: 11 }}
              axisLine={{ stroke: chartTheme.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: chartTheme.axis, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={tickFormatter}
              width={48}
            />
            <Tooltip
              content={({ active, payload, label }: any) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label != null ? String(label) : undefined}
                  theme={theme}
                  valueType={valueType}
                />
              )}
            />
            {referenceLine ? (
              <ReferenceLine
                y={referenceLine.value}
                stroke={chartTheme.referenceLine}
                strokeDasharray="4 4"
                label={{
                  value: referenceLine.label ?? 'Meta',
                  fill: chartTheme.referenceLine,
                  fontSize: 11,
                }}
              />
            ) : null}
            {visibleSeries.map((s) => {
              const index = series.findIndex((item) => item.dataKey === s.dataKey);
              return (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={getSeriesColor(s.colorIndex ?? index)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={!reduceMotion}
                />
              );
            })}
          </RechartsLineChart>
        </ResponsiveContainer>
      </ChartContainer>
      {showLegend ? (
        <ChartLegend
          series={legendSeries}
          hiddenKeys={hiddenKeys}
          onToggle={toggleSeries}
          theme={theme}
        />
      ) : null}
    </div>
  );
};

export default LineChart;
