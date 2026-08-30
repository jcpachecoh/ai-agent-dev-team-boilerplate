import * as React from 'react';
import styles from './PasswordRow.module.scss';

export interface PasswordRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  actionText?: string;
  onAction?: () => void;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function PasswordRow({
  label = 'Contraseña',
  actionText = '¿Olvidaste tu contraseña?',
  onAction,
  theme = 'light',
  size = 'md',
  className,
  ...props
}: PasswordRowProps) {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const cls = [styles.row, theme === 'dark' ? styles.dark : styles.light, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} {...props}>
      <div className={styles.label}>{label}</div>

      <button type="button" onClick={onAction} className={styles.action} aria-label={actionText}>
        {actionText}
      </button>
    </div>
  );
}

export default PasswordRow;
