import * as React from 'react';
import { Bell } from 'lucide-react';

import styles from './NotificationButton.module.scss';

export interface NotificationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  count?: number;
  theme?: 'light' | 'dark';
  /** Estilo dorado/accent (independiente de light/dark) */
  gold?: boolean;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_ICON = <Bell aria-hidden />;

export function NotificationButton({
  icon,
  count = 0,
  theme = 'light',
  gold = false,
  showBadge = true,
  size = 'md',
  className,
  ...props
}: NotificationButtonProps) {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const themeClass = gold ? styles.gold : theme === 'dark' ? styles.dark : styles.light;

  const cls = [styles.btn, sizeClass, themeClass, className].filter(Boolean).join(' ');

  return (
    <button className={cls} type="button" {...props}>
      <span className={styles.icon}>{icon ?? DEFAULT_ICON}</span>

      {count > 0 && showBadge && (
        <span className={styles.badge} aria-hidden>
          {count}
        </span>
      )}
    </button>
  );
}

export default NotificationButton;
