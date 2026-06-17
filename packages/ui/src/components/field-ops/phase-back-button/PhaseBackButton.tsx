import { ChevronLeft } from 'lucide-react';
import * as React from 'react';

import Spinner from '../../Spinner';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './PhaseBackButton.module.scss';

export interface PhaseBackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  loading?: boolean;
}

export const PhaseBackButton = React.forwardRef<HTMLButtonElement, PhaseBackButtonProps>(
  function PhaseBackButton(
    {
      label = 'Volver a la fase',
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
    const iconSize = size === 'sm' ? 16 : size === 'xl' ? 22 : 18;

    return (
      <button
        ref={ref}
        type="button"
        className={[styles.button, themeClass, sizeClass, loading && styles.loading, className]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'sm' ? 'sm' : size === 'xl' ? 'lg' : 'md'} />
        ) : (
          <>
            <ChevronLeft className={styles.icon} size={iconSize} aria-hidden />
            <span className={styles.label}>{children ?? label}</span>
          </>
        )}
      </button>
    );
  },
);

PhaseBackButton.displayName = 'PhaseBackButton';

export default PhaseBackButton;
