import React, { type JSX } from 'react';

import styles from './ProduccionOrderQueueRow.module.scss';
import type {
  ProduccionOrderQueueItem,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';
export interface ProduccionOrderQueueRowProps extends ProduccionOrderQueueItem {
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
export function ProduccionOrderQueueRow({
  orderNumber = 'OP-000012',
  recipeName = 'Costillas BBQ',
  stationLabel = 'EST-03 · Parrilla Central',
  etaLabel = '25 min',
  statusLabel = 'EN PROCESO',
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionOrderQueueRowProps): JSX.Element {
  return (
    <article
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <strong>{orderNumber}</strong>
      <div>
        <span>{recipeName}</span>
        <small>{stationLabel}</small>
      </div>
      <em>{etaLabel}</em>
      <b>{statusLabel}</b>
    </article>
  );
}
export default ProduccionOrderQueueRow;
