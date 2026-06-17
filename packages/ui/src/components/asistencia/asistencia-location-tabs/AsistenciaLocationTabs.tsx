import type { JSX } from 'react';

import type {
  AsistenciaLocationTab,
  AsistenciaSize,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import styles from './AsistenciaLocationTabs.module.scss';

export interface AsistenciaLocationTabsProps {
  tabs?: AsistenciaLocationTab[];
  activeId?: string;
  onChange?: (id: string) => void;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
  className?: string;
  'aria-label'?: string;
}

const defaultTabs: AsistenciaLocationTab[] = [
  { id: 'chapinero', name: 'Chapinero', city: 'Bogotá' },
  { id: 'zona-rosa', name: 'Zona Rosa', city: 'Bogotá' },
  { id: 'el-poblado', name: 'El Poblado', city: 'Medellín' },
  { id: 'unicentro', name: 'Unicentro', city: 'Cali' },
];

export function AsistenciaLocationTabs({
  tabs = defaultTabs,
  activeId,
  onChange,
  theme = 'dark',
  size = 'sm',
  className,
  'aria-label': ariaLabel = 'Seleccionar sede',
}: AsistenciaLocationTabsProps): JSX.Element {
  const resolvedActiveId = activeId ?? tabs[0]?.id;

  return (
    <div
      className={[styles.tabs, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === resolvedActiveId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={[styles.button, isActive && styles.active, index > 0 && styles.withDivider]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange?.(tab.id)}
          >
            <span className={styles.name}>{tab.name}</span>
            <span className={styles.city}>{tab.city}</span>
          </button>
        );
      })}
    </div>
  );
}

export default AsistenciaLocationTabs;
