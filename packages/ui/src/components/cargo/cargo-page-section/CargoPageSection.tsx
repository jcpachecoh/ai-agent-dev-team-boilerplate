import type { JSX, ReactNode } from 'react';

import styles from './CargoPageSection.module.scss';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export interface CargoPageSectionProps {
  children?: ReactNode;
  divider?: boolean;
  variant?: 'default' | 'header' | 'toolbar';
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
}

export function CargoPageSection({
  children,
  divider = false,
  variant = 'default',
  theme = 'dark',
  size = 'md',
  className,
}: CargoPageSectionProps): JSX.Element {
  return (
    <section
      className={[
        styles.section,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
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

export default CargoPageSection;
