import type { JSX, ReactNode } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolPageSection.module.scss';

export interface RolPageSectionProps {
  children?: ReactNode;
  divider?: boolean;
  variant?: 'default' | 'header' | 'toolbar' | 'body';
  sticky?: boolean;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolPageSection({
  children,
  divider = false,
  variant = 'default',
  sticky = false,
  theme = 'dark',
  size = 'md',
  className,
}: RolPageSectionProps): JSX.Element {
  return (
    <section
      className={[
        styles.section,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        divider ? styles.divider : null,
        sticky ? styles.sticky : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  );
}

export default RolPageSection;
