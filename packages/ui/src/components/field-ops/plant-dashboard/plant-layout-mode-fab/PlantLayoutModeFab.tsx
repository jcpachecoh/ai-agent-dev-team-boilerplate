import { Columns2, LayoutGrid, Maximize2 } from 'lucide-react';
import { useEffect, useRef, useState, type JSX } from 'react';

import type { PlantDashboardThemeProps, PlantLayoutMode } from '../shared/plant-workstation-types';
import styles from './PlantLayoutModeFab.module.scss';

const MODE_OPTIONS: Array<{
  mode: PlantLayoutMode;
  label: string;
  icon: typeof Maximize2;
}> = [
  { mode: '1x1', label: '1×1 — 1 pantalla', icon: Maximize2 },
  { mode: '1x2', label: '1×2 — 2 pantallas', icon: Columns2 },
  { mode: '2x2', label: '2×2 — 4 pantallas', icon: LayoutGrid },
];

export interface PlantLayoutModeFabProps extends PlantDashboardThemeProps {
  layoutMode: PlantLayoutMode;
  onLayoutModeChange: (mode: PlantLayoutMode) => void;
}

export function PlantLayoutModeFab({
  layoutMode,
  onLayoutModeChange,
  theme = 'dark',
  className,
}: PlantLayoutModeFabProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={[styles.root, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      data-testid="plant-layout-mode-fab"
    >
      {open ? (
        <div className={styles.menu} role="menu" aria-label="Modo de vista">
          <p className={styles.menuTitle}>MODO DE VISTA</p>
          {MODE_OPTIONS.map(({ mode, label, icon: Icon }) => {
            const active = mode === layoutMode;
            return (
              <button
                key={mode}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={[styles.menuItem, active && styles.menuItemActive]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  onLayoutModeChange(mode);
                  setOpen(false);
                }}
              >
                <Icon size={14} aria-hidden />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        className={[styles.fab, open && styles.fabActive].filter(Boolean).join(' ')}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Cambiar modo de vista"
        onClick={() => setOpen((value) => !value)}
      >
        <LayoutGrid size={14} aria-hidden />
      </button>
    </div>
  );
}

export default PlantLayoutModeFab;
