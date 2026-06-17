import * as React from 'react';
import styles from './InitialBadge.module.scss';

export interface InitialBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
}

export function InitialBadge({
  label = 'PA',
  size = 'md',
  theme = 'light',
  className,
  ...props
}: InitialBadgeProps) {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const themeClass = theme === 'dark' ? styles.dark : styles.light;
  const cls = [styles.badge, sizeClass, themeClass, className].filter(Boolean).join(' ');

  return (
    <div className={cls} role="status" aria-label={label} {...props}>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default InitialBadge;
