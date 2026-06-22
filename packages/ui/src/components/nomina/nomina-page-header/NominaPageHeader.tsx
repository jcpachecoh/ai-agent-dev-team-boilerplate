import type { JSX, ReactNode } from 'react';

import type { NominaTheme } from '../shared/nomina-types';
import styles from './NominaPageHeader.module.scss';

export interface NominaPageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  theme?: NominaTheme;
  className?: string;
}

export function NominaPageHeader({
  title,
  subtitle,
  badge,
  actions,
  theme = 'dark',
  className,
}: NominaPageHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.root, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <div className={styles.copy}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {badge}
        </div>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

export default NominaPageHeader;
