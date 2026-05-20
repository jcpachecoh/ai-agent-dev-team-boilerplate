import * as React from 'react';

import styles from './NavItem.module.scss';

export interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  icon?: React.ReactNode;
  iconUrl?: string;
  variant?: 'light' | 'dark';
  active?: boolean;
}

const DEFAULT_ICON_LIGHT =
  'https://www.figma.com/api/mcp/asset/24e8248a-ca97-46a3-902f-45e60ea39c15';
const DEFAULT_ICON_DARK =
  'https://www.figma.com/api/mcp/asset/27587bd9-9696-4add-b08e-4dd5d356c2b2';

export function NavItem({
  label,
  icon,
  iconUrl,
  variant = 'light',
  active = false,
  className,
  ...props
}: NavItemProps) {
  const cls = [
    styles.item,
    variant === 'dark' ? styles.dark : styles.light,
    active ? styles.active : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const src = iconUrl ?? (variant === 'dark' ? DEFAULT_ICON_DARK : DEFAULT_ICON_LIGHT);

  return (
    <div className={cls} role="button" tabIndex={0} {...props}>
      <div className={styles.icon} aria-hidden>
        {icon ? icon : <img src={src} alt="" />}
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}

export default NavItem;
