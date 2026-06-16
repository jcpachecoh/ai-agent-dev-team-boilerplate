import type { JSX, ReactNode } from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './OperationsStatsBar.module.scss';

export interface OperationsStatsBarProps {
  children: ReactNode;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export function OperationsStatsBar({
  children,
  theme = 'dark',
  size = 'md',
  className,
}: OperationsStatsBarProps): JSX.Element {
  return (
    <section
      className={[styles.bar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Resumen operativo"
    >
      {children}
    </section>
  );
}

export default OperationsStatsBar;
