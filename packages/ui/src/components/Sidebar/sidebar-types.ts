import type { ReactNode } from 'react';

export interface SidebarNavChildItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  badge?: number;
  active?: boolean;
  children?: SidebarNavChildItem[];
}

export interface SidebarUser {
  name: string;
  role: string;
  initials?: string;
}

export interface SidebarProps {
  items: SidebarNavItem[];
  theme?: 'light' | 'dark';
  collapsed?: boolean;
  open?: boolean;
  overlay?: boolean;
  brandSubtitle?: string;
  brandTitle?: string;
  activePath?: string;
  user?: SidebarUser;
  ariaLabel?: string;
  className?: string;
  onToggleCollapse?: () => void;
  onNavigate?: (href: string) => void;
}
