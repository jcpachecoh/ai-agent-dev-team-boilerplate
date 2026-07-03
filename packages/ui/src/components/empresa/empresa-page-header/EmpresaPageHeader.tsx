import { Building2 } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import type { EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaPageHeader.module.scss';

export interface EmpresaPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaPageHeader({
  title,
  subtitle,
  actions,
  icon,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaPageHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.leading}>
        <div className={styles.iconWrap} aria-hidden>
          {icon ?? <Building2 size={18} strokeWidth={1.75} />}
        </div>
        <div className={styles.text}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

export default EmpresaPageHeader;
