import * as React from 'react';
import { Line, LineChart as RechartsLineChart, ResponsiveContainer } from 'recharts';

import { ChartContainer } from '../shared/ChartContainer';
import { CHART_COLOR_TOKENS, getSeriesColor } from '../shared/chart-colors';
import type { ChartBaseProps } from '../shared/types';
import styles from './MiniChart.module.scss';

export interface MiniChartDataPoint {
  value: number;
}

export interface MiniChartProps extends Omit<
  ChartBaseProps,
  'empty' | 'emptyTitle' | 'emptyDescription'
> {
  data: MiniChartDataPoint[];
  trend?: 'up' | 'down' | 'neutral';
  dataKey?: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  trend = 'neutral',
  dataKey = 'value',
  theme = 'light',
  size = 'sm',
  loading = false,
  ariaLabel = 'Sparkline chart',
  className,
}) => {
  const strokeColor =
    trend === 'up'
      ? CHART_COLOR_TOKENS.success
      : trend === 'down'
        ? CHART_COLOR_TOKENS.danger
        : getSeriesColor(0);

  const chartData = data.map((point, index) => ({ index, [dataKey]: point.value }));
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chartHeight = {
    sm: 40,
    md: 56,
    xl: 72,
  }[size];
  return (
    <ChartContainer
      theme={theme}
      size={size}
      loading={loading}
      empty={data.length === 0}
      emptyTitle="Sin tendencia"
      emptyDescription=""
      ariaLabel={ariaLabel}
      className={[styles.wrapper, styles[size], styles[theme], className].filter(Boolean).join(' ')}
      height={chartHeight}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={!reduceMotion}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default MiniChart;
