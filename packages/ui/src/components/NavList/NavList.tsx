import * as React from 'react';

import NavItem from '../NavItem';
import styles from './NavList.module.scss';

export interface NavListItem {
  label: string;
  icon?: React.ReactNode;
  iconUrl?: string;
  active?: boolean;
}

export interface NavListProps extends React.HTMLAttributes<HTMLElement> {
  items: NavListItem[];
  theme?: 'light' | 'dark';
}

export function NavList({ items, theme = 'light', className, ...props }: NavListProps) {
  const cls = [styles.container, theme === 'dark' ? styles.dark : styles.light, className]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={cls} {...props}>
      <ul className={styles.list}>
        {items.map((it, idx) => (
          <li className={styles.item} key={idx}>
            <NavItem
              label={it.label}
              icon={it.icon}
              iconUrl={it.iconUrl}
              variant={theme}
              active={Boolean(it.active)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavList;
