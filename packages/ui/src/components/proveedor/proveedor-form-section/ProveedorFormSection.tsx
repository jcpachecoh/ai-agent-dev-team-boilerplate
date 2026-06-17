import React, { type JSX, type ReactNode } from 'react';

import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorFormSection.module.scss';

export interface ProveedorFormSectionProps {
  title?: string;
  children?: ReactNode;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorFormSection({
  title = 'Información General',
  children,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorFormSectionProps): JSX.Element {
  return (
    <section
      className={[styles.section, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>{children}</div>
    </section>
  );
}

export default ProveedorFormSection;
