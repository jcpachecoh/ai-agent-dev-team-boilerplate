import type { JSX } from 'react';

import type { AsistenciaSize, AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaLiveBadge.module.scss';

export interface AsistenciaLiveBadgeProps {
  label?: string;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
  className?: string;
}

export function AsistenciaLiveBadge({
  label = 'EN VIVO',
  theme = 'dark',
  size = 'sm',
  className,
}: AsistenciaLiveBadgeProps): JSX.Element {
  return (
    <span
      className={[styles.badge, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.dot} aria-hidden />
      {label}
    </span>
  );
}

export default AsistenciaLiveBadge;
