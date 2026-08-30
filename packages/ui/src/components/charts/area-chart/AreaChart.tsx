import * as React from 'react';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
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
import styles from './AreaChart.module.scss';

export interface AreaChartSeries {
  dataKey: string;
  name: string;
  colorIndex?: number;
}

export interface AreaChartProps extends ChartBaseProps {
  data: Array<Record<string, string | number>>;
  xDataKey: string;
  series: AreaChartSeries[];
  valueType?: ChartValueType;
  showLegend?: boolean;
  height?: number;
  xAxisInterval?: number;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xDataKey,
  series,
  valueType = 'number',
  showLegend = true,
  height,
  xAxisInterval = 0,
  theme = 'light',
  size = 'md',
  loading = false,
  empty,
  emptyTitle,
  emptyDescription,
  ariaLabel = 'Area chart',
  className,
}) => {
  const [hiddenKeys, setHiddenKeys] = React.useState<Set<string>>(new Set());
  const chartTheme = getChartTheme(theme);
  const isEmpty = empty ?? data.length === 0;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const visibleSeries = series.filter((s) => !hiddenKeys.has(s.dataKey));
  const legendSeries = series.map((s, i) => ({
    key: s.dataKey,
    name: s.name,
    color: getSeriesColor(s.colorIndex ?? i),
  }));

  const toggleSeries = (key: string): void => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
          <RechartsAreaChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
            <defs>
              {visibleSeries.map((s, index) => {
                const color = getSeriesColor(
                  s.colorIndex ?? series.findIndex((item) => item.dataKey === s.dataKey),
                );
                const id = `gradient-${s.dataKey}`;
                return (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.04} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={xDataKey}
              interval={xAxisInterval}
              tick={{ fill: chartTheme.axis, fontSize: 11 }}
              axisLine={{ stroke: chartTheme.grid }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tickFormatter={(v: number) => formatNumberCompact(Number(v))}
              tick={{ fill: chartTheme.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
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
            {visibleSeries.map((s) => {
              const index = series.findIndex((item) => item.dataKey === s.dataKey);
              const color = getSeriesColor(s.colorIndex ?? index);
              return (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={color}
                  fill={`url(#gradient-${s.dataKey})`}
                  strokeWidth={2}
                  isAnimationActive={!reduceMotion}
                />
              );
            })}
          </RechartsAreaChart>
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

export default AreaChart;
