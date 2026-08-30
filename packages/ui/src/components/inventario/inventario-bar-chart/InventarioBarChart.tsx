import React, { type CSSProperties, type JSX } from 'react';

import type {
  InventarioAccentColor,
  InventarioBarChartItem,
  InventarioSize,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioBarChart.module.scss';

export interface InventarioBarChartProps {
  items?: InventarioBarChartItem[];
  accent?: InventarioAccentColor | string;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const defaultItems: InventarioBarChartItem[] = [
  { label: 'Día 1', value: 92 },
  { label: 'Día 5', value: 88 },
  { label: 'Día 10', value: 85 },
  { label: 'Día 15', value: 90 },
  { label: 'Día 20', value: 95 },
  { label: 'Día 25', value: 89 },
  { label: 'Día 30', value: 93 },
];

function isSemanticAccent(value: string): value is InventarioAccentColor {
  return ['success', 'info', 'warning', 'danger', 'purple', 'enterprise'].includes(value);
}

export function InventarioBarChart({
  items = defaultItems,
  accent = 'success',
  theme = 'light',
  size = 'md',
  className,
}: InventarioBarChartProps): JSX.Element {
  const accentClass = isSemanticAccent(accent) ? styles[`accent--${accent}`] : undefined;
  const maxValue = Math.max(...items.map((item) => item.max ?? item.value), 1);

  return (
    <div
      className={[
        styles.chart,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        accentClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        !isSemanticAccent(accent) && accent
          ? ({ '--inventario-accent': accent } as CSSProperties)
          : undefined
      }
      role="list"
      aria-label="Histórico de ocupación"
    >
      {items.map((item) => {
        const itemMax = item.max ?? maxValue;
        const heightPercent = Math.min(100, Math.max(0, (item.value / itemMax) * 100));

        return (
          <div key={item.label} className={styles.column} role="listitem">
            <div
              className={styles.barWrap}
              style={{ '--inventario-bar-height': `${heightPercent}%` } as CSSProperties}
            >
              <span className={styles.barValue}>{item.value}%</span>
              <span className={styles.bar} aria-hidden />
            </div>
            <span className={styles.barLabel}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default InventarioBarChart;
