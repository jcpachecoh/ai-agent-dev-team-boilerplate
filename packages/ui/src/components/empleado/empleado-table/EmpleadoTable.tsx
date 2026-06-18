import type { JSX, ReactNode } from 'react';

import { EmpleadoPagination, type EmpleadoPaginationProps } from '../empleado-pagination';
import { EmpleadoTableHeader } from '../empleado-table-header';
import { getEmpleadoColumns } from '../shared/empleado-columns';
import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoTable.module.scss';

export interface EmpleadoTableProps {
  children?: ReactNode;
  footer?: ReactNode;
  pagination?: EmpleadoPaginationProps;
  showActions?: boolean;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoTable({
  children,
  footer,
  pagination,
  showActions = true,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoTableProps): JSX.Element {
  const columns = getEmpleadoColumns(showActions);

  return (
    <section
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="table"
      aria-label="Listado de empleados"
    >
      <EmpleadoTableHeader
        columns={columns}
        theme={theme}
        size={size}
        className={styles.desktopHeader}
      />
      <div className={styles.body} role="rowgroup">
        {children}
      </div>
      {footer ??
        (pagination ? <EmpleadoPagination theme={theme} size={size} {...pagination} /> : null)}
    </section>
  );
}

export default EmpleadoTable;
