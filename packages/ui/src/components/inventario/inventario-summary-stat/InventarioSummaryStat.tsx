import React, { type JSX } from 'react';

import type {
  InventarioAccentColor,
  InventarioSize,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioSummaryStat.module.scss';

export interface InventarioSummaryStatProps {
  label?: string;
  value?: string | number;
  accent?: InventarioAccentColor;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioSummaryStat({
  label = 'Valor Total Inventario',
  value = '$1.250.000.000',
  accent = 'success',
  theme = 'light',
  size = 'md',
  className,
}: InventarioSummaryStatProps): JSX.Element {
  return (
    <article
      className={[
        styles.stat,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`accent--${accent}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
    </article>
  );
}

export default InventarioSummaryStat;
