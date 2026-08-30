import type { JSX, ReactNode } from 'react';

import styles from './AsistenciaEmployeeList.module.scss';

export interface AsistenciaEmployeeListProps {
  children?: ReactNode;
  className?: string;
}

export function AsistenciaEmployeeList({
  children,
  className,
}: AsistenciaEmployeeListProps): JSX.Element {
  return (
    <div className={[styles.list, className].filter(Boolean).join(' ')}>
      <div className={styles.header} aria-hidden>
        <span className={styles.headerEmployee}>Empleado</span>
        <span className={styles.headerStatus}>Estado</span>
        <span className={styles.headerEntry}>Registro</span>
        <span className={styles.headerTime}>Tiempo</span>
        <span className={styles.headerOvertime}>Extra</span>
        <span className={styles.headerProgress}>Progreso</span>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}

export default AsistenciaEmployeeList;
