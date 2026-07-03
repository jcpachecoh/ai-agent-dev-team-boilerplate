import type { JSX } from 'react';

import type { AsistenciaSize, AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaOvertimeBadge.module.scss';

export interface AsistenciaOvertimeBadgeProps {
  label?: string;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
  className?: string;
}

export function AsistenciaOvertimeBadge({
  label = '+00h 00m ext.',
  theme = 'dark',
  size = 'sm',
  className,
}: AsistenciaOvertimeBadgeProps): JSX.Element {
  return (
    <span
      className={[styles.badge, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  );
}

export default AsistenciaOvertimeBadge;
