import React, { type JSX, type ReactNode } from 'react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioFormField.module.scss';

export type InventarioFormFieldInputType = 'input' | 'select';

export interface InventarioFormFieldProps {
  label?: string;
  inputType?: InventarioFormFieldInputType;
  children?: ReactNode;
  htmlFor?: string;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioFormField({
  label = 'CAMPO',
  inputType = 'input',
  children,
  htmlFor,
  theme = 'light',
  size = 'md',
  className,
}: InventarioFormFieldProps): JSX.Element {
  const controlId = htmlFor ?? `inventario-field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label
      className={[
        styles.field,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`type--${inputType}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      htmlFor={inputType === 'input' ? controlId : undefined}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.control}>
        {children ??
          (inputType === 'select' ? (
            <select id={controlId} className={styles.nativeSelect} defaultValue="">
              <option value="" disabled>
                Seleccionar
              </option>
            </select>
          ) : (
            <input id={controlId} className={styles.nativeInput} type="text" />
          ))}
      </div>
    </label>
  );
}

export default InventarioFormField;
