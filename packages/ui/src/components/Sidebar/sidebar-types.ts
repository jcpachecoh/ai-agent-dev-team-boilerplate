import type { ReactNode } from 'react';

import type { SidebarAccent } from './sidebar-accent';

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
  /** Module accent when this group/link is active (overrides default purple on dark theme). */
  accent?: SidebarAccent;
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
  /** When set, replaces subtitle/title text with the brand image (expanded sidebar). */
  brandLogoSrc?: string;
  /** Monogram shown when the sidebar is collapsed; defaults to `brandLogoSrc`. */
  brandLogoCollapsedSrc?: string;
  brandLogoAlt?: string;
  activePath?: string;
  user?: SidebarUser;
  ariaLabel?: string;
  className?: string;
  onToggleCollapse?: () => void;
  onNavigate?: (href: string) => void;
}
