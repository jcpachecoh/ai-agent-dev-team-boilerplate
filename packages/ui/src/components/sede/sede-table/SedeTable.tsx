import React, { type JSX, type ReactNode } from 'react';

import { SedePagination } from '../sede-pagination';
import { SedeTableHeader } from '../sede-table-header';
import type { SedePaginationProps } from '../sede-pagination';
import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeTable.module.scss';

export interface SedeTableProps {
  children?: ReactNode;
  footer?: ReactNode;
  pagination?: SedePaginationProps;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeTable({
  children,
  footer,
  pagination,
  theme = 'dark',
  size = 'md',
  className,
}: SedeTableProps): JSX.Element {
  return (
    <section
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="table"
      aria-label="Listado de sedes"
    >
      <SedeTableHeader theme={theme} size={size} className={styles.desktopHeader} />
      <div className={styles.body} role="rowgroup">
        {children}
      </div>
      {footer ?? (pagination ? <SedePagination theme={theme} size={size} {...pagination} /> : null)}
    </section>
  );
}

export default SedeTable;
