import { Factory, Map } from 'lucide-react';
import React, { type JSX } from 'react';

import styles from './ProduccionModuleTabs.module.scss';
import type {
  ProduccionSize,
  ProduccionTabItem,
  ProduccionTheme,
} from '../shared/produccion-types';

const defaultTabs: ProduccionTabItem[] = [
  { id: 'map', label: 'MAPA DE PLANTA', icon: <Map aria-hidden /> },
  { id: 'masters', label: 'CONFIGURACIÓN DE MAESTROS', icon: <Factory aria-hidden /> },
];

export interface ProduccionModuleTabsProps {
  tabs?: ProduccionTabItem[];
  activeId?: string;
  onChange?: (tabId: string) => void;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionModuleTabs({
  tabs = defaultTabs,
  activeId = 'masters',
  onChange,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionModuleTabsProps): JSX.Element {
  return (
    <nav
      className={[styles.tabs, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Módulos de producción"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            className={[styles.tab, active && styles.active].filter(Boolean).join(' ')}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange?.(tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default ProduccionModuleTabs;
