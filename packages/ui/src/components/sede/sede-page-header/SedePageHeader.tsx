import React, { type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedePageHeader.module.scss';

export interface SedePageHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  primaryAction?: ReactNode;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedePageHeader({
  title = 'Sedes',
  subtitle = 'Gestión de sedes del tenant',
  icon,
  primaryAction,
  theme = 'dark',
  size = 'md',
  className,
}: SedePageHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.leading}>
        {icon && (
          <div className={styles.iconWrap} aria-hidden>
            {icon}
          </div>
        )}
        <div className={styles.titles}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      {primaryAction && <div className={styles.action}>{primaryAction}</div>}
    </header>
  );
}

export default SedePageHeader;
