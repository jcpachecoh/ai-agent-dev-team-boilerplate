import * as React from 'react';

import styles from './Input.module.scss';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  /** control whether the left icon is rendered (useful for storybook/demo) */
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
}

export function Input({
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  showIcon = true,
  type = 'text',
  size = 'md',
  ...props
}: InputProps) {
  const [visible, setVisible] = React.useState(false);
  const isPassword = type === 'password';
  const shownType = isPassword && showPasswordToggle ? (visible ? 'text' : 'password') : type;

  const { theme = 'dark' } = props as InputProps;
  const sizeClass =
    size === 'sm'
      ? styles['wrapper--sm']
      : size === 'lg'
        ? styles['wrapper--lg']
        : styles['wrapper--md'];
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];

  return (
    <div className={[styles.wrapper, sizeClass, themeClass].filter(Boolean).join(' ')}>
      {leftIcon && showIcon && <div className={styles.left}>{leftIcon}</div>}
      <input className={styles.input} type={shownType} {...props} />
      <div className={styles.right}>
        {isPassword && showPasswordToggle ? (
          <button
            type="button"
            className={styles.iconButton}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </button>
        ) : (
          rightIcon && <div className={styles.adornment}>{rightIcon}</div>
        )}
      </div>
    </div>
  );
}

export default Input;
