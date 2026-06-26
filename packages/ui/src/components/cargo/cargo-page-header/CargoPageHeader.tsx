import type { JSX, ReactNode } from 'react';

import styles from './CargoPageHeader.module.scss';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export interface CargoPageHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  primaryAction?: ReactNode;
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
}

export function CargoPageHeader({
  title = 'Cargos',
  subtitle = 'Todos los cargos del tenant',
  icon,
  primaryAction,
  theme = 'dark',
  size = 'md',
  className,
}: CargoPageHeaderProps): JSX.Element {
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

export default CargoPageHeader;
