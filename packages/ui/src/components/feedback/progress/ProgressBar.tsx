import * as React from 'react';

import styles from './ProgressBar.module.scss';

export interface ProgressBarProps {
  value: number; // 0 to 100
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'auto';
  type?: 'linear' | 'circular';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'auto',
  type = 'linear',
  size = 'medium',
  showLabel = false,
  className,
}) => {
  const normalizedValue = Math.min(100, Math.max(0, value));

  const getVariant = (): 'success' | 'warning' | 'danger' | 'info' => {
    if (variant !== 'auto') {
      return variant;
    }
    if (normalizedValue <= 59) {
      return 'success';
    }
    if (normalizedValue <= 84) {
      return 'warning';
    }
    return 'danger';
  };

  const currentVariant = getVariant();
  const combinedClassName = [
    styles.progressContainer,
    styles[type],
    styles[size],
    styles[currentVariant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (type === 'circular') {
    const radius = size === 'small' ? 16 : size === 'medium' ? 24 : 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (normalizedValue / 100) * circumference;

    return (
      <div
        className={combinedClassName}
        role="progressbar"
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg className={styles.svg} width={radius * 2 + 8} height={radius * 2 + 8}>
          <circle
            className={styles.background}
            cx={radius + 4}
            cy={radius + 4}
            r={radius}
            strokeWidth={size === 'small' ? 4 : 6}
          />
          <circle
            className={styles.indicator}
            cx={radius + 4}
            cy={radius + 4}
            r={radius}
            strokeWidth={size === 'small' ? 4 : 6}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        {showLabel && <span className={styles.label}>{Math.round(normalizedValue)}%</span>}
      </div>
    );
  }

  return (
    <div
      className={combinedClassName}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${normalizedValue}%` }} />
      </div>
      {showLabel && <span className={styles.label}>{Math.round(normalizedValue)}%</span>}
    </div>
  );
};

export default ProgressBar;
