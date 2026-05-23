import * as React from 'react';
import styles from './Spinner.module.scss';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  /** Override del color del arco visible */
  color?: string;
}

export function Spinner({
  size = 'md',
  theme = 'light',
  color,
  className,
  ...props
}: SpinnerProps) {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const themeClass = theme === 'dark' ? styles.dark : styles.light;
  const cls = [styles.spinner, sizeClass, themeClass, className].filter(Boolean).join(' ');
  const style = color ? ({ '--spinner-color': color } as React.CSSProperties) : undefined;

  return <div className={cls} style={style} role="status" aria-live="polite" {...props} />;
}

export default Spinner;
