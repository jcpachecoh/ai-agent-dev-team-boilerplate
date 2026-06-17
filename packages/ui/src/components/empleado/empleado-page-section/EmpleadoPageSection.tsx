import type { JSX, ReactNode } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoPageSection.module.scss';

export interface EmpleadoPageSectionProps {
  children?: ReactNode;
  divider?: boolean;
  variant?: 'default' | 'header' | 'toolbar';
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoPageSection({
  children,
  divider = false,
  variant = 'default',
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoPageSectionProps): JSX.Element {
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

export default EmpleadoPageSection;
