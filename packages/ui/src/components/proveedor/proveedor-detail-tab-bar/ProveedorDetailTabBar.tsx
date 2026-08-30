import { CreditCard, FileText, Info, Package, Star } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import { ProveedorDetailTab } from '../proveedor-detail-tab/ProveedorDetailTab';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorDetailTabBar.module.scss';

export interface ProveedorDetailTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface ProveedorDetailTabBarProps {
  tabs?: ProveedorDetailTabItem[];
  activeTabId?: string;
  onTabChange?: (id: string) => void;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

const defaultTabs: ProveedorDetailTabItem[] = [
  { id: 'info', label: 'INFORMACIÓN', icon: <Info aria-hidden /> },
  { id: 'catalog', label: 'CATÁLOGO', icon: <Package aria-hidden /> },
  { id: 'history', label: 'HISTORIAL OCs', icon: <FileText aria-hidden /> },
  { id: 'quality', label: 'CALIDAD', icon: <Star aria-hidden /> },
  { id: 'payables', label: 'CUENTAS X PAGAR', icon: <CreditCard aria-hidden /> },
];

const defaultIcons: Record<string, ReactNode> = {
  info: <Info aria-hidden />,
  catalog: <Package aria-hidden />,
  history: <FileText aria-hidden />,
  quality: <Star aria-hidden />,
  payables: <CreditCard aria-hidden />,
};

export function ProveedorDetailTabBar({
  tabs = defaultTabs,
  activeTabId = 'info',
  onTabChange,
  theme = 'light',
  size = 'xl',
  className,
}: ProveedorDetailTabBarProps): JSX.Element {
  return (
    <nav
      className={[styles.bar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Secciones del proveedor"
      style={{ '--tab-count': tabs.length } as React.CSSProperties}
    >
      {tabs.map((tab) => (
        <ProveedorDetailTab
          key={tab.id}
          label={tab.label}
          icon={tab.icon ?? defaultIcons[tab.id]}
          active={tab.id === activeTabId}
          theme={theme}
          size={size}
          onClick={() => onTabChange?.(tab.id)}
        />
      ))}
    </nav>
  );
}

export default ProveedorDetailTabBar;
