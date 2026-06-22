import { Layers } from 'lucide-react';
import type { JSX } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaPhasesCount.module.scss';

export interface RecetaPhasesCountProps {
  count: number | string;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
}

export function RecetaPhasesCount({
  count,
  theme = 'dark',
  size = 'md',
  className,
}: RecetaPhasesCountProps): JSX.Element {
  return (
    <span
      className={[styles.wrap, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <Layers className={styles.icon} aria-hidden />
      <span className={styles.count}>{count}</span>
    </span>
  );
}

export default RecetaPhasesCount;
