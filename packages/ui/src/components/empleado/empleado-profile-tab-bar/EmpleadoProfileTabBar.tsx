import React, { type JSX, type ReactNode } from 'react';

import { EmpleadoProfileTab } from '../empleado-profile-tab/EmpleadoProfileTab';
import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoProfileTabBar.module.scss';

export interface EmpleadoProfileTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface EmpleadoProfileTabBarProps {
  tabs: EmpleadoProfileTabItem[];
  activeTabId?: string;
  onTabChange?: (id: string) => void;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoProfileTabBar({
  tabs,
  activeTabId,
  onTabChange,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoProfileTabBarProps): JSX.Element {
  return (
    <nav
      className={[styles.bar, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      aria-label="Secciones del perfil de empleado"
      style={{ '--tab-count': tabs.length } as React.CSSProperties}
    >
      {tabs.map((tab) => (
        <EmpleadoProfileTab
          key={tab.id}
          label={tab.label}
          icon={tab.icon}
          active={tab.id === activeTabId}
          theme={theme}
          size={size}
          onClick={() => onTabChange?.(tab.id)}
        />
      ))}
    </nav>
  );
}

export default EmpleadoProfileTabBar;
