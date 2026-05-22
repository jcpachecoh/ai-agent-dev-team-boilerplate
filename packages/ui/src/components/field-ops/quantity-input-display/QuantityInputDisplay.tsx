import * as React from 'react';

import { Skeleton } from '../../feedback/skeleton';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './QuantityInputDisplay.module.scss';

export interface QuantityInputDisplayProps {
  label?: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  loading?: boolean;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export const QuantityInputDisplay: React.FC<QuantityInputDisplayProps> = ({
  label = 'Cantidad real producida',
  value,
  unit = 'kg',
  hint,
  loading = false,
  theme = 'light',
  size = 'md',
  className,
}) => {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  if (loading) {
    return (
      <div
        className={[styles.wrapper, sizeClass, themeClass, className].filter(Boolean).join(' ')}
        aria-busy
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>
    );
  }

  return (
    <div className={[styles.wrapper, sizeClass, themeClass, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      <div className={styles.display} role="status" aria-live="polite">
        <span className={styles.value}>{value}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
};

export default QuantityInputDisplay;
