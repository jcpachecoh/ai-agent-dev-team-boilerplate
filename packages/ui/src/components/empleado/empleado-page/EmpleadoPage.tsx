import type { JSX, ReactNode } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoPage.module.scss';

export interface EmpleadoPageProps {
  children?: ReactNode;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  /** Permite scroll vertical de página (calendario + listado). No usar en tablas fill-viewport. */
  scrollable?: boolean;
  className?: string;
}

export function EmpleadoPage({
  children,
  theme = 'dark',
  size = 'md',
  scrollable = false,
  className,
}: EmpleadoPageProps): JSX.Element {
  return (
    <div
      className={[
        styles.page,
        scrollable && styles.pageScrollable,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default EmpleadoPage;
