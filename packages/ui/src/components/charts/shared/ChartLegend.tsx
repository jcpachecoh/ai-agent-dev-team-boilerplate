import * as React from 'react';

import { getChartTheme } from './chart-theme';
import styles from './ChartLegend.module.scss';
import type { ChartTheme } from './types';

export interface ChartLegendSeries {
  key: string;
  name: string;
  color: string;
}

export interface ChartLegendProps {
  series: ChartLegendSeries[];
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
  theme?: ChartTheme;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  series,
  hiddenKeys,
  onToggle,
  theme = 'light',
}) => {
  const colors = getChartTheme(theme);

  return (
    <div className={styles.legend} role="list">
      {series.map((item) => {
        const isHidden = hiddenKeys.has(item.key);
        return (
          <button
            key={item.key}
            type="button"
            role="listitem"
            className={[styles.item, isHidden && styles.hidden].filter(Boolean).join(' ')}
            style={{ color: colors.legendText }}
            onClick={() => onToggle(item.key)}
            aria-pressed={!isHidden}
          >
            <span className={styles.swatch} style={{ backgroundColor: item.color }} aria-hidden />
            {item.name}
          </button>
        );
      })}
    </div>
  );
};

export default ChartLegend;
