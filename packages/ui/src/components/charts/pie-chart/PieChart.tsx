import * as React from 'react';
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { ChartContainer } from '../shared/ChartContainer';
import { ChartTooltip } from '../shared/ChartTooltip';
import { formatCurrencyCOP } from '../shared/format-currency';
import { getSeriesColor } from '../shared/chart-colors';
import type { ChartBaseProps, ChartValueType } from '../shared/types';
import styles from './PieChart.module.scss';

export interface PieChartDataItem {
  name: string;
  value: number;
}

export type PieChartVariant = 'pie' | 'donut';

export interface PieChartProps extends ChartBaseProps {
  data: PieChartDataItem[];
  variant?: PieChartVariant;
  valueType?: ChartValueType;
  centerLabel?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  variant = 'pie',
  valueType = 'number',
  centerLabel,
  theme = 'light',
  size = 'md',
  loading = false,
  empty,
  emptyTitle,
  emptyDescription,
  ariaLabel = 'Pie chart',
  className,
}) => {
  const isEmpty = empty ?? data.length === 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const displayCenter =
    centerLabel ?? (valueType === 'currency' ? formatCurrencyCOP(total) : String(total));

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
      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={variant === 'donut' ? '58%' : 0}
              outerRadius="80%"
              paddingAngle={2}
              isAnimationActive={!reduceMotion}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getSeriesColor(index)} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  theme={theme}
                  valueType={valueType}
                  showPercent
                  total={total}
                />
              )}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
        {variant === 'donut' ? <div className={styles.centerLabel}>{displayCenter}</div> : null}
      </div>
    </ChartContainer>
  );
};

export default PieChart;
