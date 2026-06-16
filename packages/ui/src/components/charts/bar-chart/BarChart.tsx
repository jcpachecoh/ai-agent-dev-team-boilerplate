import * as React from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
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
import styles from './BarChart.module.scss';

export interface BarChartSeries {
  dataKey: string;
  name: string;
  colorIndex?: number;
}

export type BarChartVariant = 'simple' | 'grouped' | 'stacked' | 'horizontal';

export interface BarChartProps extends ChartBaseProps {
  data: Array<Record<string, string | number>>;
  xDataKey: string;
  series: BarChartSeries[];
  variant?: BarChartVariant;
  valueType?: ChartValueType;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xDataKey,
  series,
  variant = 'simple',
  valueType = 'number',
  theme = 'light',
  size = 'md',
  loading = false,
  empty,
  emptyTitle,
  emptyDescription,
  ariaLabel = 'Bar chart',
  className,
}) => {
  const chartTheme = getChartTheme(theme);
  const isEmpty = empty ?? data.length === 0;
  const isHorizontal = variant === 'horizontal';
  const stackId = variant === 'stacked' ? 'stack' : undefined;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tickFormatter = (v: number): string => formatNumberCompact(v);

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
        <RechartsBarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 12, left: isHorizontal ? 8 : 0, bottom: 4 }}
        >
          <CartesianGrid
            stroke={chartTheme.grid}
            strokeDasharray="3 3"
            horizontal={!isHorizontal}
            vertical={isHorizontal}
          />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tickFormatter={tickFormatter}
                tick={{ fill: chartTheme.axis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey={xDataKey}
                tick={{ fill: chartTheme.axis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xDataKey}
                tick={{ fill: chartTheme.axis, fontSize: 12 }}
                axisLine={{ stroke: chartTheme.grid }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={tickFormatter}
                tick={{ fill: chartTheme.axis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
            </>
          )}
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
          {series.map((s, index) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name}
              fill={getSeriesColor(s.colorIndex ?? index)}
              stackId={stackId}
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reduceMotion}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default BarChart;
