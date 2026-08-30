import type { JSX } from 'react';

import type {
  AsistenciaEmployeeStatus,
  AsistenciaSize,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import styles from './AsistenciaStatusDot.module.scss';

export interface AsistenciaStatusDotProps {
  status?: AsistenciaEmployeeStatus;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
  className?: string;
}

export function AsistenciaStatusDot({
  status = 'on-shift',
  theme = 'dark',
  size = 'sm',
  className,
}: AsistenciaStatusDotProps): JSX.Element {
  return (
    <span
      className={[
        styles.dot,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`status--${status}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    />
  );
}

export default AsistenciaStatusDot;
