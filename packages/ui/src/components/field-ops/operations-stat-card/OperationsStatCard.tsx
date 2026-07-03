import type { CSSProperties, JSX, ReactNode } from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './OperationsStatCard.module.scss';

export type OperationsStatAccent = 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'purple';

const ACCENT_PRESETS: Record<OperationsStatAccent, string> = {
  success: '#2ec4a0',
  warning: '#f0c040',
  danger: '#e05a44',
  info: '#3b82f6',
  gold: '#c8a96e',
  purple: '#8b5cf6',
};

function resolveColor(accent: OperationsStatAccent | string | undefined, fallback: string): string {
  if (!accent) return fallback;
  return ACCENT_PRESETS[accent as OperationsStatAccent] ?? accent;
}

export interface OperationsStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  iconColor?: OperationsStatAccent | string;
  valueColor?: OperationsStatAccent | string;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export function OperationsStatCard({
  label,
  value,
  icon,
  iconColor = 'success',
  valueColor,
  theme = 'dark',
  size = 'md',
  className,
}: OperationsStatCardProps): JSX.Element {
  const resolvedIconColor = resolveColor(iconColor, ACCENT_PRESETS.success);
  const resolvedValueColor = resolveColor(valueColor ?? iconColor, resolvedIconColor);

  const style = {
    '--stat-icon-color': resolvedIconColor,
    '--stat-value-color': resolvedValueColor,
  } as CSSProperties;

  return (
    <article
      className={[styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <div className={styles.content}>
        <p className={styles.value}>{value}</p>
        <p className={styles.label}>{label}</p>
      </div>
    </article>
  );
}

export default OperationsStatCard;
