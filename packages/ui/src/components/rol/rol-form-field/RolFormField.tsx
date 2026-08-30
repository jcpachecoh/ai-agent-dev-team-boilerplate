import type { JSX, ReactNode } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolFormField.module.scss';

export interface RolFormFieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolFormField({
  label,
  htmlFor,
  children,
  theme = 'dark',
  size = 'md',
  className,
}: RolFormFieldProps): JSX.Element {
  return (
    <div
      className={[styles.field, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default RolFormField;
