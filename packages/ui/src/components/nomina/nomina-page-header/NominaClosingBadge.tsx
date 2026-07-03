import type { JSX } from 'react';

import type { NominaTheme } from '../shared/nomina-types';
import styles from './NominaClosingBadge.module.scss';

export interface NominaClosingBadgeProps {
  label: string;
  theme?: NominaTheme;
  className?: string;
}

export function NominaClosingBadge({
  label,
  theme = 'dark',
  className,
}: NominaClosingBadgeProps): JSX.Element {
  return (
    <span
      className={[styles.badge, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      {label}
    </span>
  );
}

export default NominaClosingBadge;
