import * as React from 'react';

import { formatCurrencyCOP } from './format-currency';
import { formatNumberCompact } from './format-number';
import styles from './ChartTooltip.module.scss';
import { getChartTheme } from './chart-theme';
import type { ChartTheme, ChartValueType } from './types';

export interface ChartTooltipPayloadItem {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  dataKey?: string | number;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipPayloadItem[];
  theme?: ChartTheme;
  valueType?: ChartValueType;
  showPercent?: boolean;
  total?: number;
}

function formatValue(
  value: number | string | Array<number | string> | undefined,
  valueType: ChartValueType,
): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return valueType === 'currency' ? formatCurrencyCOP(num) : formatNumberCompact(num);
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  label,
  payload,
  theme = 'light',
  valueType = 'number',
  showPercent = false,
  total,
}) => {
  if (!active || !payload?.length) return null;

  const colors = getChartTheme(theme);

  return (
    <div
      className={styles.tooltip}
      style={{
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        color: colors.tooltipText,
      }}
    >
      {label ? <p className={styles.label}>{label}</p> : null}
      {payload.map((entry, index) => {
        const num = typeof entry.value === 'number' ? entry.value : Number(entry.value);
        const percent =
          showPercent && total && total > 0 && !Number.isNaN(num)
            ? ` (${((num / total) * 100).toFixed(1).replace('.', ',')}%)`
            : '';

        return (
          <div key={`${entry.dataKey ?? entry.name}-${index}`} className={styles.item}>
            {entry.color ? (
              <span className={styles.swatch} style={{ backgroundColor: entry.color }} />
            ) : null}
            <span>
              {entry.name != null ? String(entry.name) : ''}: {formatValue(entry.value, valueType)}
              {percent}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ChartTooltip;
