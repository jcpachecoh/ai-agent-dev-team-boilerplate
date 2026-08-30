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

const chartHeights = {
  sm: 40,
  md: 56,
  xl: 72,
} as const;

export const MiniChart: React.FC<MiniChartProps> = ({
  data = [],
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
  const chartHeight = chartHeights[size];
  const hasData = data.length > 0;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (loading) {
    return (
      <ChartContainer
        theme={theme}
        size={size}
        loading
        ariaLabel={ariaLabel}
        className={[styles.wrapper, styles[size], styles[theme], className]
          .filter(Boolean)
          .join(' ')}
        height={chartHeight}
      />
    );
  }

  if (!hasData) {
    return (
      <div
        className={[styles.wrapper, styles.empty, styles[size], styles[theme], className]
          .filter(Boolean)
          .join(' ')}
        role="img"
        aria-label={ariaLabel}
        style={{ height: chartHeight }}
      >
        <span className={styles.emptyLabel}>Sin tendencia</span>
      </div>
    );
  }

  return (
    <ChartContainer
      theme={theme}
      size={size}
      ariaLabel={ariaLabel}
      className={[styles.wrapper, styles[size], styles[theme], className].filter(Boolean).join(' ')}
      height={chartHeight}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsLineChart data={chartData} margin={{ top: 4, right: 6, bottom: 4, left: 2 }}>
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
