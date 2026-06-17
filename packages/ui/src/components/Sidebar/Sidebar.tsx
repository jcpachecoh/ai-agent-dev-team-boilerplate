import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import InitialBadge from '../InitialBadge';
import ProfileHeader from '../ProfileHeader';
import styles from './Sidebar.module.scss';
import type { SidebarNavItem, SidebarProps } from './sidebar-types';
import { getDefaultExpandedIds, getUserInitials, isSidebarItemActive } from './sidebar-utils';

export function Sidebar({
  items,
  theme = 'dark',
  collapsed = false,
  open = false,
  overlay = false,
  brandSubtitle = 'RESTOPSIQ',
  brandTitle = 'Plant MES',
  activePath = '/',
  user,
  ariaLabel = 'Navegación principal',
  className,
  onToggleCollapse,
  onNavigate,
}: SidebarProps): React.JSX.Element {
  const [expandedIds, setExpandedIds] = useState<string[]>(() =>
    getDefaultExpandedIds(activePath, items),
  );

  useEffect(() => {
    setExpandedIds((current) => {
      const activeParent = items.find(
        (item) => item.children && isSidebarItemActive(activePath, item),
      );
      if (!activeParent) return current;
      return current.includes(activeParent.id) ? current : [...current, activeParent.id];
    });
  }, [activePath, items]);

  const sidebarClassName = useMemo(
    () =>
      [
        styles.sidebar,
        theme === 'dark' ? styles.themeDark : styles.themeLight,
        collapsed && styles.collapsed,
        overlay && styles.overlay,
        open && styles.open,
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [className, collapsed, open, overlay, theme],
  );

  const profileTheme = theme;
  const userInitials = user ? (user.initials ?? getUserInitials(user.name)) : '';

  const handleNavigate = (href: string): void => {
    onNavigate?.(href);
  };

  return (
    <aside className={sidebarClassName} aria-label={ariaLabel}>
      <div className={styles.header}>
        <p className={styles.brandSubtitle}>{brandSubtitle}</p>
        <h1 className={styles.brandTitle}>{brandTitle}</h1>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {items.map((item) => (
            <SidebarNavItemRow
              key={item.id}
              item={item}
              collapsed={collapsed}
              expanded={!collapsed && expandedIds.includes(item.id)}
              onToggleExpanded={() =>
                setExpandedIds((current) =>
                  current.includes(item.id)
                    ? current.filter((id) => id !== item.id)
                    : [...current, item.id],
                )
              }
              onNavigate={handleNavigate}
            />
          ))}
        </ul>
      </nav>

      {user ? (
        <div className={styles.footer}>
          <div className={styles.footerRow}>
            {collapsed ? (
              <InitialBadge
                label={userInitials}
                theme={profileTheme}
                size="lg"
                className={styles.profileCompact}
              />
            ) : (
              <ProfileHeader
                name={user.name}
                subtitle={user.role}
                badgeLabel={userInitials}
                theme={profileTheme}
                titleSize="md"
                badgeSize="lg"
                className={styles.profileHeader}
              />
            )}

            <button
              type="button"
              className={styles.collapseButton}
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              <ChevronLeft
                size={16}
                className={collapsed ? styles.collapseIconCollapsed : undefined}
                aria-hidden
              />
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.collapseButton}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <ChevronLeft
              size={16}
              className={collapsed ? styles.collapseIconCollapsed : undefined}
              aria-hidden
            />
          </button>
        </div>
      )}
    </aside>
  );
}

interface SidebarNavItemRowProps {
  item: SidebarNavItem;
  collapsed: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onNavigate: (href: string) => void;
}

function SidebarNavItemRow({
  item,
  collapsed,
  expanded,
  onToggleExpanded,
  onNavigate,
}: SidebarNavItemRowProps): React.JSX.Element {
  const isActive = Boolean(item.active);
  const hasChildren = Boolean(item.children?.length);

  const handleParentClick = (): void => {
    if (collapsed && hasChildren) {
      const target = item.children?.find((child) => child.active)?.href ?? item.children?.[0]?.href;
      if (target) {
        onNavigate(target);
      }
      return;
    }

    onToggleExpanded();
  };

  if (hasChildren) {
    return (
      <li className={styles.navGroup}>
        <button
          type="button"
          className={[
            styles.navButton,
            isActive && styles.navButtonActive,
            isActive && styles.parentActive,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-expanded={expanded}
          aria-label={collapsed ? item.label : undefined}
          title={collapsed ? item.label : undefined}
          onClick={handleParentClick}
        >
          {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
          <span className={styles.label}>{item.label}</span>
          {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
          <ChevronRight
            size={16}
            className={[styles.chevron, expanded && styles.expanded].filter(Boolean).join(' ')}
            aria-hidden
          />
        </button>

        {expanded ? (
          <ul className={styles.submenu}>
            {item.children?.map((child) => (
              <li key={child.id}>
                <a
                  href={child.href}
                  className={[styles.submenuLink, child.active && styles.active]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={child.active ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(child.href);
                  }}
                >
                  {child.icon ? <span className={styles.submenuIcon}>{child.icon}</span> : null}
                  {child.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li className={styles.navGroup}>
      <a
        href={item.href ?? '/'}
        className={[styles.navLink, isActive && styles.active].filter(Boolean).join(' ')}
        aria-current={isActive ? 'page' : undefined}
        aria-label={collapsed ? item.label : undefined}
        title={collapsed ? item.label : undefined}
        onClick={(event) => {
          event.preventDefault();
          onNavigate(item.href ?? '/');
        }}
      >
        {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
        <span className={styles.label}>{item.label}</span>
        {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
      </a>
    </li>
  );
}

export default Sidebar;
