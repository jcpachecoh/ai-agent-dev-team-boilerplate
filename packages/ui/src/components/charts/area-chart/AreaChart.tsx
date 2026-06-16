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
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xDataKey,
  series,
  valueType = 'number',
  theme = 'light',
  size = 'md',
  loading = false,
  empty,
  emptyTitle,
  emptyDescription,
  ariaLabel = 'Area chart',
  className,
}) => {
  const chartTheme = getChartTheme(theme);
  const isEmpty = empty ?? data.length === 0;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <ChartContainer
      theme={theme}
      size={size}
      loading={loading}
      empty={isEmpty}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      ariaLabel={ariaLabel}
      className={[styles.wrapper, className].filter(Boolean).join(' ')}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <defs>
            {series.map((s, index) => {
              const color = getSeriesColor(s.colorIndex ?? index);
              const id = `gradient-${s.dataKey}`;
              return (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xDataKey}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.grid }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: any) => formatNumberCompact(Number(v))}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
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
          {series.map((s, index) => {
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
  );
};

export default AreaChart;
