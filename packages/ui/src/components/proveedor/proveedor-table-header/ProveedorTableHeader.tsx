import React, { type CSSProperties, type JSX } from 'react';

import { defaultSupplierColumns } from '../shared/proveedor-columns';
import type { ProveedorColumnDef } from '../shared/proveedor-columns';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorTableHeader.module.scss';

export type ProveedorTableColumn = ProveedorColumnDef;

export interface ProveedorTableHeaderProps {
  columns?: ProveedorTableColumn[];
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

const alignClasses = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
} as const;

export function ProveedorTableHeader({
  columns = defaultSupplierColumns,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorTableHeaderProps): JSX.Element {
  const template = columns.map((column) => column.width ?? '1fr').join(' ');

  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--proveedor-columns': template } as CSSProperties}
    >
      {columns.map((column) => (
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

export default ProveedorTableHeader;
