import * as React from 'react';
import { ArrowRight } from 'lucide-react';

import styles from './Button.module.scss';
import Spinner from '../Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'cargar';
  size?: 'small' | 'medium' | 'large';
  arrow?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    className,
    children,
    size = 'medium',
    arrow = false,
    loading = false,
    ...props
  },
  ref,
): React.JSX.Element {
  const variantClass = styles[variant] ?? styles.primary;
  const sizeClass =
    size === 'large' ? styles.large : size === 'small' ? styles.small : styles.medium;
  const loadingClass = loading ? styles.loading : '';
  const combinedClassName = [styles.button, variantClass, sizeClass, loadingClass, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      ref={ref}
      className={combinedClassName}
      data-variant={variant}
      data-size={size}
      disabled={loading || props.disabled}
      {...props}
      aria-busy={loading}
    >
      {loading ? (
        <span aria-hidden>
          <Spinner
            size={size === 'large' ? 'lg' : size === 'small' ? 'sm' : 'md'}
            color={variant === 'cargar' ? '#4b3406' : undefined}
          />
        </span>
      ) : (
        <>
          {children}
          {arrow && (
            <span className={styles.arrow} aria-hidden>
              <ArrowRight size={16} strokeWidth={2.5} />
            </span>
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
