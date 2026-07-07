import { Plus } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import type {
  InventarioPrimaryButtonVariant,
  InventarioSize,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioPrimaryButton.module.scss';

export interface InventarioPrimaryButtonProps {
  label?: string;
  variant?: InventarioPrimaryButtonVariant;
  icon?: ReactNode;
  showIcon?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioPrimaryButton({
  label = 'CREAR PRODUCTO',
  variant = 'primary',
  icon,
  showIcon = true,
  onClick,
  disabled = false,
  type = 'button',
  theme = 'light',
  size = 'md',
  className,
}: InventarioPrimaryButtonProps): JSX.Element {
  const resolvedIcon = icon ?? (showIcon ? <Plus aria-hidden /> : null);

  return (
    <button
      type={type}
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {resolvedIcon ? <span className={styles.icon}>{resolvedIcon}</span> : null}
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default InventarioPrimaryButton;
