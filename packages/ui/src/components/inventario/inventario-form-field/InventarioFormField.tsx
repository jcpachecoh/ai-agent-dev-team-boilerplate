import React, { type JSX, type ReactNode } from 'react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioFormField.module.scss';

export type InventarioFormFieldInputType = 'input' | 'select';

export interface InventarioFormFieldProps {
  label?: string;
  inputType?: InventarioFormFieldInputType;
  /** When true, children provide their own border (e.g. InventarioSelect). */
  bareControl?: boolean;
  children?: ReactNode;
  htmlFor?: string;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioFormField({
  label = 'CAMPO',
  inputType = 'input',
  bareControl = false,
  children,
  htmlFor,
  theme = 'light',
  size = 'md',
  className,
}: InventarioFormFieldProps): JSX.Element {
  const controlId = htmlFor ?? `inventario-field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const controlClass = bareControl ? styles.controlBare : styles.control;
  const Wrapper = bareControl ? 'div' : 'label';
  const linkedId = htmlFor ?? (!children && inputType === 'input' ? controlId : undefined);
  const wrapperProps = bareControl ? {} : { htmlFor: linkedId };

  return (
    <Wrapper
      className={[
        styles.field,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`type--${inputType}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...wrapperProps}
    >
      <span className={styles.label}>{label}</span>
      <div className={controlClass}>
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
    </Wrapper>
  );
}

export default InventarioFormField;
