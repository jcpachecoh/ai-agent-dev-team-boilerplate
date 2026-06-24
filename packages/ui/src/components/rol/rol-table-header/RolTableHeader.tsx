import type { CSSProperties, JSX } from 'react';

import { getRolColumns, getRolGridTemplate } from '../shared/rol-columns';
import type { RolColumnDef } from '../shared/rol-columns';
import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolTableHeader.module.scss';

const alignClasses = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
} as const;

export interface RolTableHeaderProps {
  columns?: RolColumnDef[];
  showActions?: boolean;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolTableHeader({
  columns,
  showActions = true,
  theme = 'dark',
  size = 'md',
  className,
}: RolTableHeaderProps): JSX.Element {
  const resolvedColumns = columns ?? getRolColumns(showActions);

  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--rol-columns': getRolGridTemplate(showActions) } as CSSProperties}
    >
      {resolvedColumns.map((column) => (
        <span
          key={column.key}
          className={[styles.cell, alignClasses[column.align ?? 'left']].join(' ')}
          role="columnheader"
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

export default RolTableHeader;
