import React, { type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedePageSection.module.scss';

export interface SedePageSectionProps {
  children?: ReactNode;
  divider?: boolean;
  variant?: 'default' | 'header' | 'toolbar';
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedePageSection({
  children,
  divider = false,
  variant = 'default',
  theme = 'light',
  size = 'md',
  className,
}: SedePageSectionProps): JSX.Element {
  return (
    <section
      className={[
        styles.section,
        styles[`variant--${variant}`],
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        divider && styles.divider,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  );
}

export default SedePageSection;
