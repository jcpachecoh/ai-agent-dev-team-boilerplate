import { Download, FileText } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaUtilityButton.module.scss';

export type RecetaUtilityButtonVariant = 'view' | 'pdf';

export interface RecetaUtilityButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: RecetaUtilityButtonVariant;
  label?: string;
  icon?: ReactNode;
  theme?: RecetaTheme;
  size?: RecetaSize;
}

const labels: Record<RecetaUtilityButtonVariant, string> = {
  view: 'Ver',
  pdf: 'PDF',
};

const icons: Record<RecetaUtilityButtonVariant, JSX.Element> = {
  view: <FileText aria-hidden />,
  pdf: <Download aria-hidden />,
};

export function RecetaUtilityButton({
  variant = 'view',
  label,
  icon,
  disabled = false,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: RecetaUtilityButtonProps): JSX.Element {
  const displayLabel = label ?? labels[variant];

  return (
    <button
      type="button"
      className={[styles.button, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...props}
    >
      <span className={styles.icon}>{icon ?? icons[variant]}</span>
      <span className={styles.label}>{displayLabel}</span>
    </button>
  );
}

export default RecetaUtilityButton;
