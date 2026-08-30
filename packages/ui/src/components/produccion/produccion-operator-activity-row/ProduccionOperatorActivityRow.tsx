import React, { type JSX } from 'react';

import styles from './ProduccionOperatorActivityRow.module.scss';
import type {
  ProduccionOperatorActivityItem,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';
export interface ProduccionOperatorActivityRowProps extends ProduccionOperatorActivityItem {
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
export function ProduccionOperatorActivityRow({
  operatorName = 'J. García',
  stationLabel = 'EST-05 — Frituras',
  actionLabel = 'Completó fase',
  timeLabel = 'Hace 2 min',
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionOperatorActivityRowProps): JSX.Element {
  return (
    <article
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.dot} />
      <div>
        <strong>
          {operatorName} · {stationLabel}
        </strong>
        <p>{actionLabel}</p>
      </div>
      <time>{timeLabel}</time>
    </article>
  );
}
export default ProduccionOperatorActivityRow;
