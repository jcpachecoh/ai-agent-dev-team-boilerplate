import type { SidebarNavItem } from './sidebar-types';

export function isSidebarItemActive(activePath: string, item: SidebarNavItem): boolean {
  if (item.active) return true;
  if (item.href && isSidebarPathActive(activePath, item.href)) return true;
  return item.children?.some((child) => isSidebarChildPathActive(activePath, child.href)) ?? false;
}

export function isSidebarPathActive(activePath: string, href: string): boolean {
  if (href === '/') return activePath === '/';
  return activePath === href || activePath.startsWith(`${href}/`);
}

export function isSidebarChildPathActive(activePath: string, href: string): boolean {
  return activePath === href;
}

export function getDefaultExpandedIds(activePath: string, items: SidebarNavItem[]): string[] {
  return items
    .filter((item) => item.children && isSidebarItemActive(activePath, item))
    .map((item) => item.id);
}

export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
