import { Plus } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaPhaseAddButton.module.scss';

export interface RecetaPhaseAddButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  icon?: ReactNode;
  theme?: RecetaTheme;
  size?: RecetaSize;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

const sizeClasses: Record<RecetaSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  xl: styles.sizeXl,
};

export function RecetaPhaseAddButton({
  label = 'Agregar Fase',
  icon,
  theme = 'dark',
  size = 'md',
  className,
  disabled,
  ...props
}: RecetaPhaseAddButtonProps): JSX.Element {
  const displayIcon = icon ?? <Plus aria-hidden />;

  return (
    <button
      type="button"
      className={[styles.button, themeClasses[theme], sizeClasses[size], className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...props}
    >
      <span className={styles.icon}>{displayIcon}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default RecetaPhaseAddButton;
