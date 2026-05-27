import { CircleCheck, CircleOff } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX } from 'react';

import type { RecetaSize, RecetaStatus, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaStatusButton.module.scss';

export interface RecetaStatusButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  status?: RecetaStatus;
  label?: string;
  theme?: RecetaTheme;
  size?: RecetaSize;
}

export function RecetaStatusButton({
  status = 'active',
  label,
  disabled = false,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: RecetaStatusButtonProps): JSX.Element {
  const isActive = status === 'active';
  const Icon = isActive ? CircleCheck : CircleOff;
  const displayLabel = label ?? (isActive ? 'Activa' : 'Inactiva');

  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`status--${status}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={isActive}
      disabled={disabled}
      {...props}
    >
      <Icon className={styles.icon} aria-hidden />
      <span>{displayLabel}</span>
    </button>
  );
}

export default RecetaStatusButton;
