import type { JSX, ReactNode } from 'react';

import styles from './AsistenciaEmployeeGrid.module.scss';

export interface AsistenciaEmployeeGridProps {
  children?: ReactNode;
  className?: string;
}

export function AsistenciaEmployeeGrid({
  children,
  className,
}: AsistenciaEmployeeGridProps): JSX.Element {
  return <div className={[styles.grid, className].filter(Boolean).join(' ')}>{children}</div>;
}

export default AsistenciaEmployeeGrid;
