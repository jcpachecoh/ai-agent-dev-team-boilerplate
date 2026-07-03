import * as React from 'react';
import { LayoutDashboard } from 'lucide-react';

import styles from './NavItem.module.scss';

export interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  icon?: React.ReactNode;
  /** @deprecated Use `icon` with a Lucide (or other) React node instead. */
  iconUrl?: string;
  theme?: 'light' | 'dark';
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DEFAULT_ICON = <LayoutDashboard aria-hidden />;

export function NavItem({
  label,
  icon,
  iconUrl,
  theme = 'light',
  active = false,
  size = 'md',
  className,
  ...props
}: NavItemProps) {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;

  const cls = [
    styles.item,
    sizeClass,
    theme === 'dark' ? styles.dark : styles.light,
    active ? styles.active : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconContent = icon ?? (iconUrl ? <img src={iconUrl} alt="" /> : DEFAULT_ICON);

  return (
    <div className={cls} role="button" tabIndex={0} {...props}>
      <div className={styles.icon} aria-hidden>
        {iconContent}
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}

export default NavItem;
