import type { ReactNode } from 'react';

import styles from './PayrollFilterBar.module.scss';

interface PayrollFilterBarProps {
  children: ReactNode;
}

/** Fila única de filtros + acciones, alineados al fondo con el mismo alto de control (40px). */
export function PayrollFilterBar({ children }: PayrollFilterBarProps): React.JSX.Element {
  return <div className={styles.filtersRow}>{children}</div>;
}
