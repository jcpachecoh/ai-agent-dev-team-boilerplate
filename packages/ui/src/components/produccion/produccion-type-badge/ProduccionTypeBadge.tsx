import React, { type JSX } from 'react';

import styles from './ProduccionTypeBadge.module.scss';
import type {
  ProduccionSize,
  ProduccionStationTone,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionTypeBadgeProps {
  label?: string;
  tone?: ProduccionStationTone;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionTypeBadge({
  label = 'Preparación',
  tone = 'preparation',
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionTypeBadgeProps): JSX.Element {
  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`tone--${tone}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  );
}

export default ProduccionTypeBadge;
