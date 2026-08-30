import type { JSX, ReactNode } from 'react';

import type { AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaLocationList.module.scss';

export interface AsistenciaLocationListProps {
  children?: ReactNode;
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaLocationList({
  children,
  theme = 'dark',
  className,
}: AsistenciaLocationListProps): JSX.Element {
  return (
    <div className={[styles.list, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      <div className={styles.header} role="row">
        <span>Sede</span>
        <span>Ciudad</span>
        <span className={styles.headerMetric}>Turno</span>
        <span className={styles.headerMetric}>Ausentes</span>
        <span className={styles.headerMetric}>Tarde</span>
        <span className={styles.headerMetric}>H. extra</span>
        <span aria-hidden />
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export default AsistenciaLocationList;
