import React, {
  type JSX,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { RecetaTextInput } from '../receta-text-input/RecetaTextInput';
import type { RecetaTheme } from '../shared/receta-types';
import styles from './RecetaWizardField.module.scss';

export interface RecetaWizardFieldProps {
  label: string;
  htmlFor?: string;
  fullWidth?: boolean;
  theme?: RecetaTheme;
  className?: string;
  children: ReactNode;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaWizardField({
  label,
  htmlFor,
  fullWidth = false,
  theme = 'dark',
  className,
  children,
}: RecetaWizardFieldProps): JSX.Element {
  return (
    <label
      className={[styles.field, themeClasses[theme], fullWidth && styles.fieldFull, className]
        .filter(Boolean)
        .join(' ')}
      htmlFor={htmlFor}
    >
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}

export interface RecetaWizardSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  theme?: RecetaTheme;
}

export function RecetaWizardSelect({
  theme = 'dark',
  className,
  ...props
}: RecetaWizardSelectProps): JSX.Element {
  return (
    <select
      className={[styles.select, themeClasses[theme], className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export interface RecetaWizardTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  theme?: RecetaTheme;
}

export function RecetaWizardTextarea({
  theme = 'dark',
  className,
  ...props
}: RecetaWizardTextareaProps): JSX.Element {
  return (
    <textarea
      className={[styles.textarea, themeClasses[theme], className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}

export { RecetaTextInput as RecetaWizardInput };

export default RecetaWizardField;
