import { LogOut } from 'lucide-react';
import * as React from 'react';

import Spinner from '../../Spinner';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './LogoutButton.module.scss';

export type LogoutButtonVariant = 'default' | 'icon';

export interface LogoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  variant?: LogoutButtonVariant;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  loading?: boolean;
}

export const LogoutButton = React.forwardRef<HTMLButtonElement, LogoutButtonProps>(
  function LogoutButton(
    {
      label = 'Salir',
      variant = 'default',
      theme = 'light',
      size = 'md',
      loading = false,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ): React.JSX.Element {
    const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
    const sizeClass = styles[`size--${size}`];
    const variantClass = styles[`variant--${variant}`];
    const iconSize = size === 'sm' ? 14 : size === 'xl' ? 20 : 16;

    const contentLabel = children ?? label;
    const ariaLabel = props['aria-label'] ?? (variant === 'icon' ? label : undefined);

    return (
      <button
        ref={ref}
        type="button"
        className={[
          styles.button,
          themeClass,
          sizeClass,
          variantClass,
          loading && styles.loading,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-label={ariaLabel}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'sm' ? 'sm' : size === 'xl' ? 'lg' : 'md'} />
        ) : (
          <>
            <LogOut className={styles.icon} size={iconSize} aria-hidden />
            {variant !== 'icon' && <span className={styles.label}>{contentLabel}</span>}
          </>
        )}
      </button>
    );
  },
);

LogoutButton.displayName = 'LogoutButton';

export default LogoutButton;
