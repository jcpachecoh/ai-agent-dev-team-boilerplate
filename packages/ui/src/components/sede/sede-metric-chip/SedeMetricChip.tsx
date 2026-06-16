import React, { type CSSProperties, type JSX } from 'react';

import type { SedeMetricValueColor, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeMetricChip.module.scss';

export interface SedeMetricChipProps {
  label?: string;
  value?: string | number;
  valueColor?: SedeMetricValueColor;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeMetricChip({
  label = 'Total sedes',
  value = 0,
  valueColor = 'primary',
  theme = 'dark',
  size = 'md',
  className,
}: SedeMetricChipProps): JSX.Element {
  return (
    <article
      className={[
        styles.chip,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`color--${valueColor}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </article>
  );
}

export default SedeMetricChip;
