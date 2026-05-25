import * as React from 'react';

import NavItem from '../NavItem';
import styles from './NavList.module.scss';

export interface NavListItem {
  label: string;
  icon?: React.ReactNode;
  /** @deprecated Use `icon` with a Lucide React node */
  iconUrl?: string;
  active?: boolean;
}

export interface NavListProps extends React.HTMLAttributes<HTMLElement> {
  items: NavListItem[];
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  /** Max height before scroll; omit for no scroll cap */
  maxHeight?: number | string;
}

export function NavList({
  items,
  theme = 'light',
  size = 'md',
  maxHeight = 320,
  className,
  ...props
}: NavListProps) {
  const cls = [
    styles.container,
    styles[`size--${size}`],
    theme === 'dark' ? styles.dark : styles.light,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const scrollStyle =
    maxHeight !== undefined
      ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
      : undefined;

  return (
    <nav className={cls} {...props}>
      <div className={styles.scrollArea} style={scrollStyle}>
        <ul className={styles.list}>
          {items.map((it, idx) => (
            <li className={styles.item} key={`${it.label}-${idx}`}>
              <NavItem
                label={it.label}
                icon={it.icon}
                iconUrl={it.iconUrl}
                theme={theme}
                size={size}
                active={Boolean(it.active)}
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default NavList;
