import { BadgeCheck, Check } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX } from 'react';

import Spinner from '../../Spinner';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './CompletePhaseButton.module.scss';

export type CompletePhaseButtonVariant = 'default' | 'confirm';

export interface CompletePhaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CompletePhaseButtonVariant;
  label?: string;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  loading?: boolean;
}

export function CompletePhaseButton({
  variant = 'default',
  label,
  theme = 'light',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: CompletePhaseButtonProps): JSX.Element {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];
  const variantClass = styles[`variant--${variant}`];
  const defaultLabel = variant === 'confirm' ? 'Confirmar y completar fase' : 'Completar fase';
  const displayLabel = children ?? label ?? defaultLabel;
  const iconSize = size === 'sm' ? 18 : size === 'xl' ? 28 : 22;
  const confirmIconSize = size === 'sm' ? 20 : size === 'xl' ? 32 : 26;

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
      ) : variant === 'confirm' ? (
        <>
          <BadgeCheck className={styles.confirmIcon} size={confirmIconSize} aria-hidden />
          <span className={styles.label}>{displayLabel}</span>
        </>
      ) : (
        <>
          <Check className={styles.icon} size={iconSize} aria-hidden />
          <span className={styles.label}>{displayLabel}</span>
        </>
      )}
    </button>
  );
}

export default CompletePhaseButton;
