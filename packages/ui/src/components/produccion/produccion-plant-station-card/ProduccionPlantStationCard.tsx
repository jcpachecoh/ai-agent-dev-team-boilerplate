import React, { type JSX } from 'react';

import styles from './ProduccionPlantStationCard.module.scss';
import { ProduccionStatusBadge } from '../produccion-status-badge/ProduccionStatusBadge';
import type {
  ProduccionPlantStationData,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';
export interface ProduccionPlantStationCardProps extends ProduccionPlantStationData {
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
export function ProduccionPlantStationCard({
  code = 'EST-03',
  name = 'Parrilla Central',
  status = 'active',
  tone = 'cooking',
  meta = '2 OP activas',
  progress = 72,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionPlantStationCardProps): JSX.Element {
  return (
    <article
      className={[
        styles.card,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`tone--${tone}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.top}>
        <span>{code}</span>
        <ProduccionStatusBadge status={status} theme={theme} size="sm" />
      </div>
      <h3>{name}</h3>
      <p>{meta}</p>
      <div className={styles.track}>
        <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </article>
  );
}
export default ProduccionPlantStationCard;
