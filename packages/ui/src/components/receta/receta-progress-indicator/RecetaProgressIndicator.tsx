import React, { type CSSProperties, type JSX } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaProgressIndicator.module.scss';

export type RecetaProgressVariant = 'success' | 'warning' | 'danger';

export interface RecetaProgressIndicatorProps {
  value?: number;
  max?: number;
  variant?: RecetaProgressVariant;
  showLabel?: boolean;
  label?: string;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
}

function clampPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

export function RecetaProgressIndicator({
  value = 85,
  max = 100,
  variant = 'warning',
  showLabel = true,
  label,
  theme = 'light',
  size = 'md',
  className,
}: RecetaProgressIndicatorProps): JSX.Element {
  const percent = clampPercent(value, max);
  const displayLabel = label ?? `${percent}%`;

  return (
    <div
      className={[
        styles.progress,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        !showLabel && styles.noLabel,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--receta-progress-value': `${percent}%` } as CSSProperties}
    >
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={displayLabel}
      >
        <span className={styles.fill} />
      </div>
      {showLabel && <span className={styles.label}>{displayLabel}</span>}
    </div>
  );
}

export default RecetaProgressIndicator;
