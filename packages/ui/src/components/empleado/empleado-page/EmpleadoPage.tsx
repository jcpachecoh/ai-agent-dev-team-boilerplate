import type { JSX, ReactNode } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoPage.module.scss';

export interface EmpleadoPageProps {
  children?: ReactNode;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoPage({
  children,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoPageProps): JSX.Element {
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

export default EmpleadoPage;
