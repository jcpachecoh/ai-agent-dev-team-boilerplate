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

const statusLabels: Record<RecetaStatus, string> = {
  active: 'Activa',
  inactive: 'Inactiva',
};

export function RecetaStatusButton({
  status = 'active',
  label,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: RecetaStatusButtonProps): JSX.Element {
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
      aria-pressed={status === 'active'}
      {...props}
    >
      <span>{label ?? statusLabels[status]}</span>
    </button>
  );
}

export default RecetaStatusButton;
