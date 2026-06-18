import { ChevronDown } from 'lucide-react';
import type { CSSProperties, JSX } from 'react';

import { defaultEmpleadoColumns, getEmpleadoGridTemplate } from '../shared/empleado-columns';
import type { EmpleadoColumnDef } from '../shared/empleado-columns';
import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoTableHeader.module.scss';

export interface EmpleadoTableHeaderProps {
  columns?: EmpleadoColumnDef[];
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoTableHeader({
  columns = defaultEmpleadoColumns,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoTableHeaderProps): JSX.Element {
  const showActions = columns.some((column) => column.key === 'actions');

  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--empleado-columns': getEmpleadoGridTemplate(showActions) } as CSSProperties}
    >
      {columns.map((column) => (
        <div key={column.key} className={styles.cell} role="columnheader">
          <span className={column.key === 'employee' ? styles.accent : undefined}>
            {column.label}
          </span>
          {column.sortable ? <ChevronDown aria-hidden /> : null}
        </div>
      ))}
    </div>
  );
}

export default EmpleadoTableHeader;
