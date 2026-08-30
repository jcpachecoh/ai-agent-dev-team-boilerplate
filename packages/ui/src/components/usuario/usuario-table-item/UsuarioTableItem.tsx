import type { JSX } from 'react';

import { UsuarioTableCard } from '../usuario-table-card';
import { UsuarioTableRow, type UsuarioTableRowProps } from '../usuario-table-row';
import styles from './UsuarioTableItem.module.scss';

export type UsuarioTableItemProps = UsuarioTableRowProps;

export function UsuarioTableItem({ className, ...props }: UsuarioTableItemProps): JSX.Element {
  return (
    <>
      <UsuarioTableRow
        {...props}
        className={[styles.desktop, className].filter(Boolean).join(' ')}
      />
      <UsuarioTableCard
        {...props}
        className={[styles.mobile, className].filter(Boolean).join(' ')}
      />
    </>
  );
}

export default UsuarioTableItem;
