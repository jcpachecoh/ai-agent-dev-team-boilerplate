import React, { type CSSProperties, type JSX } from 'react';

import type {
  InventarioAccentColor,
  InventarioSize,
  InventarioTheme,
} from '../shared/inventario-types';
import styles from './InventarioDistributionBar.module.scss';

export interface InventarioDistributionBarProps {
  label?: string;
  value?: string | number;
  progress?: number;
  max?: number;
  accent?: InventarioAccentColor | string;
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

export function InventarioDistributionBar({
  label = 'Proteínas',
  value = '32%',
  progress = 32,
  max = 100,
  accent = 'success',
  theme = 'light',
  size = 'md',
  className,
}: InventarioDistributionBarProps): JSX.Element {
  const percent = clampPercent(progress, max);
  const accentClass = isSemanticAccent(accent) ? styles[`accent--${accent}`] : undefined;
  const customStyle = {
    ...(!isSemanticAccent(accent) && accent ? { '--inventario-accent': accent } : {}),
    '--inventario-bar-value': `${percent}%`,
  } as CSSProperties;

  return (
    <div
      className={[
        styles.bar,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        accentClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={customStyle}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${value}`}
    >
      <div className={styles.meta}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </div>
      <div className={styles.track}>
        <span className={styles.fill} />
      </div>
    </div>
  );
}

export default InventarioDistributionBar;
