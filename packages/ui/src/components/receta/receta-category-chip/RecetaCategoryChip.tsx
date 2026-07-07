import type { JSX } from 'react';

import type { RecetaCategoryTone } from '../shared/receta-category-utils';
import { resolveRecetaCategoryTone } from '../shared/receta-category-utils';
import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaCategoryChip.module.scss';

export interface RecetaCategoryChipProps {
  label: string;
  tone?: RecetaCategoryTone;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
}

export function RecetaCategoryChip({
  label,
  tone,
  theme = 'dark',
  size = 'md',
  className,
}: RecetaCategoryChipProps): JSX.Element {
  const resolvedTone = tone ?? resolveRecetaCategoryTone(label);

  return (
    <span
      className={[
        styles.chip,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`tone--${resolvedTone}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default RecetaCategoryChip;
