import type { JSX } from 'react';

import { EmpleadoTableCard } from '../empleado-table-card';
import { EmpleadoTableRow, type EmpleadoTableRowProps } from '../empleado-table-row';
import styles from './EmpleadoTableItem.module.scss';

export type EmpleadoTableItemProps = EmpleadoTableRowProps;

export function EmpleadoTableItem({ className, ...props }: EmpleadoTableItemProps): JSX.Element {
  return (
    <>
      <EmpleadoTableRow
        {...props}
        className={[styles.desktop, className].filter(Boolean).join(' ')}
      />
      <EmpleadoTableCard
        {...props}
        className={[styles.mobile, className].filter(Boolean).join(' ')}
      />
    </>
  );
}

export default EmpleadoTableItem;
