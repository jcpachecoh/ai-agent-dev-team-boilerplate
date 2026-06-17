import React, { type InputHTMLAttributes, type JSX } from 'react';

import styles from './RecetaTextInput.module.scss';
import type { RecetaTheme } from '../shared/receta-types';

export interface RecetaTextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  theme?: RecetaTheme;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaTextInput({
  theme = 'dark',
  className,
  placeholder,
  ...props
}: RecetaTextInputProps): JSX.Element {
  return (
    <input
      className={[styles.input, themeClasses[theme], className].filter(Boolean).join(' ')}
      {...props}
      placeholder={placeholder}
    />
  );
}

export default RecetaTextInput;
