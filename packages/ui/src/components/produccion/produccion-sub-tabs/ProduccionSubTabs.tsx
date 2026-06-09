import { ListChecks, Workflow } from 'lucide-react';
import React, { type JSX } from 'react';

import styles from './ProduccionSubTabs.module.scss';
import type {
  ProduccionSize,
  ProduccionTabItem,
  ProduccionTheme,
} from '../shared/produccion-types';

const defaultTabs: ProduccionTabItem[] = [
  { id: 'stations', label: 'ESTACIONES', icon: <ListChecks aria-hidden /> },
  { id: 'recipes', label: 'RECETAS DE PRODUCCIÓN', icon: <Workflow aria-hidden /> },
];

export interface ProduccionSubTabsProps {
  tabs?: ProduccionTabItem[];
  activeId?: string;
  roleLabel?: string;
  onChange?: (tabId: string) => void;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionSubTabs({
  tabs = defaultTabs,
  activeId = 'stations',
  roleLabel = 'ROL: SUPERVISOR',
  onChange,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionSubTabsProps): JSX.Element {
  return (
    <div
      className={[styles.wrap, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <nav className={styles.tabs} aria-label="Configuración de maestros">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              className={[styles.tab, active && styles.active].filter(Boolean).join(' ')}
              aria-current={active ? 'page' : undefined}
              onClick={() => onChange?.(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      <span className={styles.role}>{roleLabel}</span>
    </div>
  );
}

export default ProduccionSubTabs;
