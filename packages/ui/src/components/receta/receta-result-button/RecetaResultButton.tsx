import { AlertTriangle, CircleCheck, CircleX } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { RecetaResult, RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaResultButton.module.scss';

export interface RecetaResultButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: RecetaResult;
  label?: string;
  icon?: ReactNode;
  theme?: RecetaTheme;
  size?: RecetaSize;
}

const labels: Record<RecetaResult, string> = {
  ok: 'OK',
  warning: 'Advertencia',
  failed: 'Fallido',
};

const icons: Record<RecetaResult, JSX.Element> = {
  ok: <CircleCheck aria-hidden />,
  warning: <AlertTriangle aria-hidden />,
  failed: <CircleX aria-hidden />,
};

export function RecetaResultButton({
  variant = 'ok',
  label,
  icon,
  disabled = false,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: RecetaResultButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...props}
    >
      <span className={styles.icon}>{icon ?? icons[variant]}</span>
      <span>{label ?? labels[variant]}</span>
    </button>
  );
}

export default RecetaResultButton;
