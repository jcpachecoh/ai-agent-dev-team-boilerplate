import React, { type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeFormCard.module.scss';

export interface SedeFormCardProps {
  title?: string;
  children?: ReactNode;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeFormCard({
  title = 'Información de la sede',
  children,
  theme = 'dark',
  size = 'md',
  className,
}: SedeFormCardProps): JSX.Element {
  return (
    <section
      className={[styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
      </header>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

export default SedeFormCard;
