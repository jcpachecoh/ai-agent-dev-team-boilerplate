import React, { type ButtonHTMLAttributes, type JSX } from 'react';

import type { EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaActionButton.module.scss';

export type EmpresaActionButtonVariant = 'primary' | 'secondary';

export interface EmpresaActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: EmpresaActionButtonVariant;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
}

export function EmpresaActionButton({
  children,
  variant = 'primary',
  theme = 'dark',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: EmpresaActionButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={[
        styles.button,
        styles[`button--${variant}`],
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

export default EmpresaActionButton;
