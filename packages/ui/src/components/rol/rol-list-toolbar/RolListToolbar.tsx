import type { JSX, ReactNode } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolListToolbar.module.scss';

export interface RolListToolbarProps {
  count: number;
  countLabel?: string;
  primaryAction?: ReactNode;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

function formatCountLabel(count: number, label: string): string {
  if (label === 'roles') {
    return `${count} rol${count !== 1 ? 'es' : ''}`;
  }
  return `${count} ${label}`;
}

export function RolListToolbar({
  count,
  countLabel = 'roles',
  primaryAction,
  theme = 'dark',
  size = 'md',
  className,
}: RolListToolbarProps): JSX.Element {
  return (
    <div
      className={[styles.toolbar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.count}>{formatCountLabel(count, countLabel)}</span>
      {primaryAction ? <div className={styles.action}>{primaryAction}</div> : null}
    </div>
  );
}

export default RolListToolbar;
