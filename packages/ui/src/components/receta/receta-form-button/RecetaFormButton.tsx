import { Plus, Save, X } from 'lucide-react';
import React, { type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react';

import styles from './RecetaFormButton.module.scss';
import type { RecetaTheme } from '../shared/receta-types';

export type RecetaFormButtonVariant = 'save' | 'discard' | 'add' | 'cancel';

export interface RecetaFormButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  variant?: RecetaFormButtonVariant;
  label?: string;
  icon?: ReactNode;
  theme?: RecetaTheme;
}

const labels: Record<RecetaFormButtonVariant, string> = {
  save: 'Guardar Receta',
  discard: 'Descartar',
  add: 'Agregar',
  cancel: 'Cancelar',
};

const icons: Partial<Record<RecetaFormButtonVariant, JSX.Element>> = {
  save: <Save aria-hidden />,
  discard: <X aria-hidden />,
  add: <Plus aria-hidden />,
};

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

const variantClasses: Record<RecetaFormButtonVariant, string> = {
  save: styles.variantSave,
  discard: styles.variantDiscard,
  add: styles.variantAdd,
  cancel: styles.variantCancel,
};

export function RecetaFormButton({
  variant = 'save',
  label,
  icon,
  theme = 'dark',
  className,
  disabled,
  ...props
}: RecetaFormButtonProps): JSX.Element {
  const displayIcon = icon ?? icons[variant];

  return (
    <button
      type="button"
      className={[styles.button, themeClasses[theme], variantClasses[variant], className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      {...props}
    >
      {displayIcon && <span className={styles.icon}>{displayIcon}</span>}
      <span className={styles.label}>{label ?? labels[variant]}</span>
    </button>
  );
}

export default RecetaFormButton;
