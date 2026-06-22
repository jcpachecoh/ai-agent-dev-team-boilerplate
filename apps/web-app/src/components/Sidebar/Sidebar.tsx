import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  isNavChildPathActive,
  isNavItemActive,
  isNavPathActive,
  navigationItems,
  type NavItem,
} from '@/constants/navigation';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useUiTheme } from '@/hooks/useUiTheme';
import { getVisibleNavigationItems } from '@/utils/navigation-access';
import {
  Sidebar,
  SIDEBAR_BRAND_MARK_DARK,
  SIDEBAR_BRAND_MARK_LIGHT,
  WEB_LOGIN_BRAND_LOGO_DARK,
  WEB_LOGIN_BRAND_LOGO_LIGHT,
  type SidebarNavItem,
} from '@restopsiq/ui';

interface AppSidebarProps {
  collapsed?: boolean;
  open?: boolean;
  overlay?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

function mapNavItem(item: NavItem, pathname: string): SidebarNavItem {
  const Icon = item.icon;

  return {
    id: item.id,
    label: item.label,
    href: item.path,
    badge: item.badge,
    accent: item.accent,
    active: isNavItemActive(pathname, item),
    icon: <Icon size={18} aria-hidden />,
    children: item.children?.map((child) => {
      const ChildIcon = child.icon;

      return {
        id: child.id,
        label: child.label,
        href: child.path,
        active: isNavChildPathActive(pathname, child.path),
        icon: <ChildIcon size={14} aria-hidden />,
      };
    }),
  };
}

export default function AppSidebar({
  collapsed = false,
  open = false,
  overlay = false,
  onToggleCollapse,
  onNavigate,
}: AppSidebarProps): React.JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const theme = useUiTheme();
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();

  const visibleItems = useMemo(() => {
    const items = getVisibleNavigationItems(roleCode, navigationItems);
    // #region agent log
    fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6b229d' },
      body: JSON.stringify({
        sessionId: '6b229d',
        runId: 'sidebar-fix',
        hypothesisId: 'H3',
        location: 'Sidebar.tsx:visibleItems',
        message: 'sidebar navigation resolved',
        data: {
          roleCode: roleCode ?? null,
          meLoaded: Boolean(me),
          visibleCount: items.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return items;
  }, [me, roleCode]);

  const items = useMemo(
    () => visibleItems.map((item) => mapNavItem(item, pathname)),
    [visibleItems, pathname],
  );

  return (
    <Sidebar
      theme={theme}
      brandLogoSrc={theme === 'dark' ? WEB_LOGIN_BRAND_LOGO_DARK : WEB_LOGIN_BRAND_LOGO_LIGHT}
      brandLogoCollapsedSrc={theme === 'dark' ? SIDEBAR_BRAND_MARK_DARK : SIDEBAR_BRAND_MARK_LIGHT}
      items={items}
      activePath={pathname}
      collapsed={collapsed}
      open={open}
      overlay={overlay}
      onToggleCollapse={onToggleCollapse}
      onNavigate={(href) => {
        void navigate(href);
        onNavigate?.();
      }}
    />
  );
}

export { isNavPathActive };
