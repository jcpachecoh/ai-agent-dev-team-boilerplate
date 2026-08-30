import type { JSX } from 'react';

import type { AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaProgressBar.module.scss';

export interface AsistenciaProgressBarProps {
  value?: number;
  tone?: 'accent' | 'amber' | 'muted';
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaProgressBar({
  value = 0,
  tone = 'accent',
  theme = 'dark',
  className,
}: AsistenciaProgressBarProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={[styles.track, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <div
        className={[styles.fill, styles[`tone--${tone}`]].filter(Boolean).join(' ')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default AsistenciaProgressBar;
