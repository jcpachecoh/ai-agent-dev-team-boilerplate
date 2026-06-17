import type { JSX } from 'react';

import { AsistenciaStatusDot } from '../asistencia-status-dot';
import type {
  AsistenciaEmployeeStatus,
  AsistenciaSize,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import styles from './AsistenciaLegendItem.module.scss';

export interface AsistenciaLegendItemProps {
  label: string;
  status: AsistenciaEmployeeStatus;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
  className?: string;
}

export function AsistenciaLegendItem({
  label,
  status,
  theme = 'dark',
  size = 'sm',
  className,
}: AsistenciaLegendItemProps): JSX.Element {
  return (
    <span className={[styles.item, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      <AsistenciaStatusDot status={status} theme={theme} size={size} />
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default AsistenciaLegendItem;
