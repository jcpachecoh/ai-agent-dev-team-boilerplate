import type { JSX, ReactNode } from 'react';

import type { PermisoTheme } from '../shared/permiso-types';
import styles from './PermisoModuleGroup.module.scss';

export interface PermisoModuleGroupProps {
  module: string;
  count?: number;
  children: ReactNode;
  theme?: PermisoTheme;
  className?: string;
}

export function PermisoModuleGroup({
  module,
  count,
  children,
  theme = 'dark',
  className,
}: PermisoModuleGroupProps): JSX.Element {
  return (
    <div className={[styles.group, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      <div className={styles.label}>
        {module}
        {count !== undefined ? <span className={styles.count}>({count})</span> : null}
      </div>
      {children}
    </div>
  );
}

export default PermisoModuleGroup;
