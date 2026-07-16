import type { JSX, ReactNode } from 'react';

import {
  EmpleadoPagination,
  type EmpleadoPaginationProps,
} from '../../empleado/empleado-pagination';
import { RolTableHeader } from '../rol-table-header';
import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolTable.module.scss';

export interface RolTableProps {
  children?: ReactNode;
  emptyState?: ReactNode;
  pagination?: EmpleadoPaginationProps;
  showActions?: boolean;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolTable({
  children,
  emptyState,
  pagination,
  showActions = true,
  theme = 'dark',
  size = 'md',
  className,
}: RolTableProps): JSX.Element {
  const hasChildren = Boolean(children);

  return (
    <section
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="table"
      aria-label="Listado de roles"
    >
      <RolTableHeader theme={theme} size={size} showActions={showActions} />
      <div className={styles.body} role="rowgroup">
        {hasChildren ? children : emptyState}
      </div>
      {pagination ? <EmpleadoPagination theme={theme} {...pagination} /> : null}
    </section>
  );
}

export default RolTable;
