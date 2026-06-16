import React, { type CSSProperties, type JSX } from 'react';

import type { SedeMetricValueColor, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeKpiCard.module.scss';

export interface SedeKpiCardProps {
  label?: string;
  value?: string | number;
  valueColor?: SedeMetricValueColor;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeKpiCard({
  label = 'Total sedes',
  value = 0,
  valueColor = 'primary',
  theme = 'light',
  size = 'md',
  className,
}: SedeKpiCardProps): JSX.Element {
  return (
    <article
      className={[
        styles.card,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`color--${valueColor}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className={styles.value}>{value}</p>
      <p className={styles.label}>{label}</p>
    </article>
  );
}

export default SedeKpiCard;
