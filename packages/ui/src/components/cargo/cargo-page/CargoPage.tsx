import type { JSX, ReactNode } from 'react';

import styles from './CargoPage.module.scss';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export interface CargoPageProps {
  children?: ReactNode;
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
}

export function CargoPage({
  children,
  theme = 'dark',
  size = 'md',
  className,
}: CargoPageProps): JSX.Element {
  return (
    <div
      className={[styles.page, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default CargoPage;
