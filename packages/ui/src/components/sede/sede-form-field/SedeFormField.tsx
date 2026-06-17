import React, { type InputHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeFormField.module.scss';

export interface SedeFormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  required?: boolean;
  children?: ReactNode;
  htmlFor?: string;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeFormField({
  label = 'Campo',
  required = false,
  children,
  htmlFor,
  theme = 'dark',
  size = 'md',
  className,
  id,
  ...inputProps
}: SedeFormFieldProps): JSX.Element {
  const fieldId = id ?? htmlFor ?? `sede-field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div
      className={[styles.field, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <label className={styles.label} htmlFor={children ? undefined : fieldId}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children ?? <input id={fieldId} className={styles.input} {...inputProps} />}
    </div>
  );
}

export default SedeFormField;
