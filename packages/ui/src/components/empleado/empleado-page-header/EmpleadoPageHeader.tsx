import type { JSX, ReactNode } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoPageHeader.module.scss';

export interface EmpleadoPageHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  primaryAction?: ReactNode;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoPageHeader({
  title = 'Empleados',
  subtitle = 'Todos los empleados del tenant',
  icon,
  primaryAction,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoPageHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.leading}>
        {icon ? (
          <div className={styles.iconWrap} aria-hidden>
            {icon}
          </div>
        ) : null}
        <div className={styles.titles}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      {primaryAction ? <div className={styles.action}>{primaryAction}</div> : null}
    </header>
  );
}

export default EmpleadoPageHeader;
