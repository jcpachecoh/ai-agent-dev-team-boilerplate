import { AlertCircle, Pause } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX } from 'react';

import Spinner from '../../Spinner';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './TripActionButton.module.scss';

export interface TripActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'pause' | 'report-issue';
  label?: string;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  loading?: boolean;
}

const variantLabels: Record<NonNullable<TripActionButtonProps['variant']>, string> = {
  pause: 'Pausar',
  'report-issue': 'Reportar Novedad',
};

export function TripActionButton({
  variant = 'pause',
  label,
  theme = 'light',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: TripActionButtonProps): JSX.Element {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];
  const variantClass = styles[`variant--${variant}`];
  const iconSize = size === 'sm' ? 16 : size === 'xl' ? 24 : 20;

  const combinedClassName = [
    styles.button,
    themeClass,
    sizeClass,
    variantClass,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const displayLabel = children ?? label ?? variantLabels[variant];

  return (
    <button
      type="button"
      className={combinedClassName}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Spinner size={size === 'sm' ? 'sm' : size === 'xl' ? 'lg' : 'md'} />
      ) : (
        <>
          <span className={styles.icon}>
            {variant === 'pause' ? (
              <Pause size={iconSize} aria-hidden />
            ) : (
              <AlertCircle size={iconSize} aria-hidden />
            )}
          </span>
          <span className={styles.label}>{displayLabel}</span>
        </>
      )}
    </button>
  );
}

export default TripActionButton;
