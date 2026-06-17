import { Bell, Search } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import { InventarioContextBadge } from '../inventario-context-badge';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioTopBar.module.scss';

export interface InventarioTopBarProps {
  plantLabel?: string;
  shiftLabel?: string;
  dateTime?: string;
  searchPlaceholder?: string;
  badges?: ReactNode;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

export function InventarioTopBar({
  plantLabel = 'PLANTA CENTRAL',
  shiftLabel = 'TURNO: MAÑANA',
  dateTime = 'Viernes, 29 May 2026 · 10:42',
  searchPlaceholder = 'Buscar en inventario...',
  badges,
  theme = 'light',
  size = 'md',
  className,
}: InventarioTopBarProps): JSX.Element {
  return (
    <header
      className={[styles.topBar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.badges}>
        {badges ?? (
          <>
            <InventarioContextBadge label={plantLabel} variant="status" theme={theme} size={size} />
            <InventarioContextBadge label={shiftLabel} variant="shift" theme={theme} size={size} />
          </>
        )}
      </div>
      <div className={styles.search}>
        <Search aria-hidden />
        <span>{searchPlaceholder}</span>
      </div>
      <div className={styles.meta}>
        <span className={styles.dateTime}>{dateTime}</span>
        <button type="button" className={styles.iconButton} aria-label="Notificaciones">
          <Bell aria-hidden />
        </button>
      </div>
    </header>
  );
}

export default InventarioTopBar;
