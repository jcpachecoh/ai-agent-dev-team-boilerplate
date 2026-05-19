import * as React from 'react';
import styles from './Spinner.module.scss';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  /** CSS color string for the spinner (uses as the visible segment color) */
  color?: string;
}

export function Spinner({ size = 'md', color, className, ...props }: SpinnerProps) {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const cls = [styles.spinner, sizeClass, className].filter(Boolean).join(' ');
  const style: React.CSSProperties = {};
  if (color) (style as any)['--spinner-color'] = color;

  return <div className={cls} style={style} role="status" aria-live="polite" {...props} />;
}

export default Spinner;
