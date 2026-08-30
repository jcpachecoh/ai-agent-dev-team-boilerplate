import React, { type InputHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaFormField.module.scss';

export interface EmpresaFormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  required?: boolean;
  icon?: ReactNode;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaFormField({
  label,
  required = false,
  icon,
  theme = 'dark',
  size = 'md',
  className,
  id,
  readOnly,
  ...rest
}: EmpresaFormFieldProps): JSX.Element {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      className={[styles.field, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.labelRow}>
        {icon ? <span className={styles.labelIcon}>{icon}</span> : null}
        <label className={styles.label} htmlFor={fieldId}>
          {label}
          {required ? <span className={styles.required}> *</span> : null}
        </label>
      </div>
      <input
        id={fieldId}
        className={styles.input}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
        {...rest}
      />
    </div>
  );
}

export interface EmpresaFieldRowProps {
  children: ReactNode;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaFieldRow({
  children,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaFieldRowProps): JSX.Element {
  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default EmpresaFormField;
