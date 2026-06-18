import { ChevronDown } from 'lucide-react';
import type { CSSProperties, JSX } from 'react';

import { getUsuarioColumns, getUsuarioGridTemplate } from '../shared/usuario-columns';
import type { UsuarioColumnDef } from '../shared/usuario-columns';
import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioTableHeader.module.scss';

export interface UsuarioTableHeaderProps {
  columns?: UsuarioColumnDef[];
  showActions?: boolean;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioTableHeader({
  columns,
  showActions = true,
  theme = 'dark',
  size = 'md',
  className,
}: UsuarioTableHeaderProps): JSX.Element {
  const resolvedColumns = columns ?? getUsuarioColumns(showActions);

  return (
    <div
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      style={{ '--usuario-columns': getUsuarioGridTemplate(showActions) } as CSSProperties}
    >
      {resolvedColumns.map((column) => (
        <div key={column.key} className={styles.cell} role="columnheader">
          <span className={column.key === 'email' ? styles.accent : undefined}>{column.label}</span>
          {column.sortable ? <ChevronDown aria-hidden /> : null}
        </div>
      ))}
    </div>
  );
}

export default UsuarioTableHeader;
