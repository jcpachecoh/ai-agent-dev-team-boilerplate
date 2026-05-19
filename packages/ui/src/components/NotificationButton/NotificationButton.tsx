import * as React from 'react';
import styles from './NotificationButton.module.scss';

export interface NotificationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string; // image URL
  count?: number;
  variant?: 'light' | 'dark' | 'gold';
  showBadge?: boolean;
}

const DEFAULT_ICON = 'https://www.figma.com/api/mcp/asset/35f0c90d-e431-41b1-860b-43280c92aee5';

export function NotificationButton({
  icon,
  count = 0,
  variant = 'dark',
  showBadge = true,
  className,
  ...props
}: NotificationButtonProps) {
  const cls = [
    styles.btn,
    variant === 'light' ? styles.light : variant === 'gold' ? styles.gold : styles.dark,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} type="button" {...props}>
      <span className={styles.icon}>
        <img src={icon ?? DEFAULT_ICON} alt="icon" />
      </span>

      {count > 0 && showBadge && (
        <span className={styles.badge} aria-hidden>
          {count}
        </span>
      )}
    </button>
  );
}

export default NotificationButton;
