import type { JSX } from 'react';

import type {
  AsistenciaEmployeeStatus,
  AsistenciaSize,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import styles from './AsistenciaStatusBadge.module.scss';

const statusLabels: Record<AsistenciaEmployeeStatus, string> = {
  'on-shift': 'EN TURNO',
  absent: 'AUSENTE',
  'off-schedule': 'FUERA DE HORARIO',
};

export interface AsistenciaStatusBadgeProps {
  status?: AsistenciaEmployeeStatus;
  label?: string;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
  className?: string;
}

export function AsistenciaStatusBadge({
  status = 'on-shift',
  label,
  theme = 'dark',
  size = 'sm',
  className,
}: AsistenciaStatusBadgeProps): JSX.Element {
  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`status--${status}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label ?? statusLabels[status]}
    </span>
  );
}

export default AsistenciaStatusBadge;
