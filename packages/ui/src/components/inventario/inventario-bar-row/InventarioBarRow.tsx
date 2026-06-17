import React, { type CSSProperties, type JSX } from 'react';

import type {
  InventarioAccentColor,
  InventarioBarRowDensity,
  InventarioSize,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioBarRow.module.scss';

export interface InventarioBarRowProps {
  label?: string;
  value?: string | number;
  progress?: number;
  max?: number;
  accent?: InventarioAccentColor | string;
  density?: InventarioBarRowDensity;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

function clampPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

function isSemanticAccent(value: string): value is InventarioAccentColor {
  return ['success', 'info', 'warning', 'danger', 'purple', 'enterprise'].includes(value);
}

export function InventarioBarRow({
  label = 'POLLO ENTERO',
  value = 850,
  progress = 100,
  max = 100,
  accent = 'success',
  density = 'compact',
  theme = 'dark',
  size = 'md',
  className,
}: InventarioBarRowProps): JSX.Element {
  const percent = clampPercent(progress, max);
  const accentClass = isSemanticAccent(accent) ? styles[`accent--${accent}`] : undefined;
  const customStyle = {
    ...(!isSemanticAccent(accent) && accent ? { '--inventario-accent': accent } : {}),
    '--inventario-bar-value': `${percent}%`,
  } as CSSProperties;

  return (
    <div
      className={[
        styles.row,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`density--${density}`],
        accentClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={customStyle}
    >
      <div className={styles.meta}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${value}`}
      >
        <span className={styles.fill} />
      </div>
    </div>
  );
}

export default InventarioBarRow;
