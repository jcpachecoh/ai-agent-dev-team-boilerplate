import type { JSX, ReactNode } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolPageHeader.module.scss';

export interface RolPageHeaderProps {
  title?: string;
  subtitle?: string;
  primaryAction?: ReactNode;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolPageHeader({
  title = 'Roles',
  subtitle = 'Gestión de roles y asignación de permisos por rol',
  primaryAction,
  theme = 'dark',
  size = 'md',
  className,
}: RolPageHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.titles}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      {primaryAction ? <div className={styles.action}>{primaryAction}</div> : null}
    </header>
  );
}

export default RolPageHeader;
