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
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    showIcon = true,
    type = 'text',
    size = 'md',
    theme = 'dark',
    error = false,
    disabled,
    className,
    ...props
  },
  ref,
) {
  const [visible, setVisible] = React.useState(false);
  const isPassword = type === 'password';
  const shownType = isPassword && showPasswordToggle ? (visible ? 'text' : 'password') : type;

  const sizeClass =
    size === 'sm'
      ? styles['wrapper--sm']
      : size === 'lg'
        ? styles['wrapper--lg']
        : styles['wrapper--md'];
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const hasLeftIcon = Boolean(leftIcon && showIcon);
  const hasRightAdornment = Boolean(rightIcon || (isPassword && showPasswordToggle));

  const wrapperCls = [
    styles.wrapper,
    sizeClass,
    themeClass,
    hasLeftIcon ? styles['wrapper--has-left'] : '',
    hasRightAdornment ? styles['wrapper--has-right'] : '',
    error ? styles['wrapper--error'] : '',
    disabled ? styles['wrapper--disabled'] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperCls}>
      {hasLeftIcon ? <div className={styles.left}>{leftIcon}</div> : null}
      <input ref={ref} className={styles.input} type={shownType} {...props} />
      <div className={styles.right}>
        {isPassword && showPasswordToggle ? (
          <button
            type="button"
            className={styles.iconButton}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setVisible((v) => !v)}
            disabled={disabled}
          >
            {visible ? <EyeOff /> : <Eye />}
          </button>
        ) : (
          rightIcon && <div className={styles.adornment}>{rightIcon}</div>
        )}
      </div>
    </div>
  );
});

export default Input;
