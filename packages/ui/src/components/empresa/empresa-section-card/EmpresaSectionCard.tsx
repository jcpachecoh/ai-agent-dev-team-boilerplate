import React, { type JSX, type ReactNode } from 'react';

import type { EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaSectionCard.module.scss';

export interface EmpresaSectionCardProps {
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaSectionCard({
  title,
  icon,
  children,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaSectionCardProps): JSX.Element {
  return (
    <section
      className={[styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.header}>
        {icon ? <span className={styles.headerIcon}>{icon}</span> : null}
        <h2 className={styles.headerTitle}>{title}</h2>
      </header>
      {children ? <div className={styles.body}>{children}</div> : null}
    </section>
  );
}

export default EmpresaSectionCard;
