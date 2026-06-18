import type { JSX, ReactNode } from 'react';

import { UsuarioTableHeader } from '../usuario-table-header';
import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioTable.module.scss';

export interface UsuarioTableProps {
  children?: ReactNode;
  emptyState?: ReactNode;
  showActions?: boolean;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioTable({
  children,
  emptyState,
  showActions = true,
  theme = 'dark',
  size = 'md',
  className,
}: UsuarioTableProps): JSX.Element {
  return (
    <section
      className={[styles.table, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="table"
      aria-label="Listado de usuarios"
    >
      <UsuarioTableHeader
        theme={theme}
        size={size}
        showActions={showActions}
        className={styles.desktopHeader}
      />
      <div className={styles.body} role="rowgroup">
        {children ?? emptyState}
      </div>
    </section>
  );
}

export default UsuarioTable;
