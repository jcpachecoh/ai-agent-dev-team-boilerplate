import type { JSX, ReactNode } from 'react';

import type { PermisoTheme } from '../shared/permiso-types';
import styles from './PermisoModuleGroup.module.scss';

export interface PermisoModuleGroupProps {
  module: string;
  count?: number;
  selectedCount?: number;
  allSelected?: boolean;
  onToggleAll?: () => void;
  children: ReactNode;
  theme?: PermisoTheme;
  className?: string;
}

export function PermisoModuleGroup({
  module,
  count,
  selectedCount,
  allSelected = false,
  onToggleAll,
  children,
  theme = 'dark',
  className,
}: PermisoModuleGroupProps): JSX.Element {
  const showCounter = selectedCount !== undefined && count !== undefined;

  return (
    <div className={[styles.group, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      <div className={styles.label}>
        <span className={styles.moduleName}>{module}</span>
        {showCounter ? (
          <span className={styles.count}>
            {selectedCount}/{count}
          </span>
        ) : count !== undefined ? (
          <span className={styles.count}>({count})</span>
        ) : null}
        {onToggleAll ? (
          <button
            type="button"
            className={styles.toggleAllBtn}
            onClick={onToggleAll}
            aria-label={
              allSelected ? `Deseleccionar todos en ${module}` : `Seleccionar todos en ${module}`
            }
          >
            {allSelected ? 'Ninguno' : 'Todos'}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default PermisoModuleGroup;
