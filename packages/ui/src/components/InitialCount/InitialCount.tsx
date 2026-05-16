import * as React from 'react';
import styles from './InitialCount.module.scss';

export interface InitialCountProps extends React.HTMLAttributes<HTMLDivElement> {
  /** label text shown under the number (e.g. PENDIENTES) */
  label?: string;
  /** legacy: single or two-letter abbreviation (falls back to `label` if provided) */
  letter?: string;
  number?: number | string;
  /** color for the big number */
  numberColor?: string;
  /** color for the label text */
  labelColor?: string;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function InitialCount({
  label,
  letter = '',
  number = 0,
  numberColor = '#2F82FF',
  labelColor,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: InitialCountProps) {
  const finalLabel = label ?? letter ?? '';
  const finalLabelColor = labelColor ?? (theme === 'dark' ? '#5A5A72' : '#72729A');
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const cls = [styles.wrapper, sizeClass, className].filter(Boolean).join(' ');

  return (
    <div className={cls} {...props}>
      <span className={styles.number} style={{ color: numberColor }} aria-label={`count ${number}`}>
        {number}
      </span>
      {finalLabel ? (
        <span className={styles.label} style={{ color: finalLabelColor }} aria-hidden>
          {finalLabel}
        </span>
      ) : null}
    </div>
  );
}

export default InitialCount;
