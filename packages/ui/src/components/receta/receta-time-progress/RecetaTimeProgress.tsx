import type { JSX } from 'react';

import { resolveDurationProgressPercent } from '../shared/receta-category-utils';
import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaTimeProgress.module.scss';

export interface RecetaTimeProgressProps {
  durationMin: number;
  maxDurationMin?: number;
  label?: string;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
}

export function RecetaTimeProgress({
  durationMin,
  maxDurationMin = 120,
  label,
  theme = 'dark',
  size = 'md',
  className,
}: RecetaTimeProgressProps): JSX.Element {
  const resolvedLabel = label ?? `${durationMin} min`;
  const progress = resolveDurationProgressPercent(durationMin, maxDurationMin);

  return (
    <div
      className={[styles.wrap, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.label}>{resolvedLabel}</span>
      <span className={styles.track} aria-hidden>
        <span className={styles.fill} style={{ width: `${progress}%` }} />
      </span>
    </div>
  );
}

export default RecetaTimeProgress;
