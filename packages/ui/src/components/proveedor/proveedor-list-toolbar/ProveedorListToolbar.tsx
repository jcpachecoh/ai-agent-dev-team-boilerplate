import React, { type JSX, type ReactNode } from 'react';

import { ProveedorActionButton } from '../proveedor-action-button/ProveedorActionButton';
import { RecetaSearch } from '../../receta/receta-search/RecetaSearch';
import type { ProveedorSize, ProveedorTheme } from '../shared/proveedor-types';
import styles from './ProveedorListToolbar.module.scss';

export interface ProveedorListToolbarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  categoryFilter?: ReactNode;
  statusFilter?: ReactNode;
  exportAction?: ReactNode;
  primaryAction?: ReactNode;
  showExport?: boolean;
  showPrimary?: boolean;
  theme?: ProveedorTheme;
  size?: ProveedorSize;
  className?: string;
}

export function ProveedorListToolbar({
  searchValue = '',
  searchPlaceholder = 'Buscar proveedor...',
  onSearchChange,
  categoryFilter,
  statusFilter,
  exportAction,
  primaryAction,
  showExport = true,
  showPrimary = true,
  theme = 'light',
  size = 'md',
  className,
}: ProveedorListToolbarProps): JSX.Element {
  const recetaTheme = theme;

  return (
    <div
      className={[styles.toolbar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.filters}>
        <RecetaSearch
          value={searchValue}
          placeholder={searchPlaceholder}
          onChange={onSearchChange}
          theme={recetaTheme}
          size={size === 'xl' ? 'md' : size}
          ariaLabel="Buscar proveedor"
          className={styles.search}
        />
        {categoryFilter && <div className={styles.filterSlot}>{categoryFilter}</div>}
        {statusFilter && <div className={styles.filterSlot}>{statusFilter}</div>}
      </div>
      <div className={styles.actions}>
        {showExport &&
          (exportAction ?? <ProveedorActionButton variant="export" theme={theme} size={size} />)}
        {showPrimary &&
          (primaryAction ?? <ProveedorActionButton variant="primary" theme={theme} size={size} />)}
      </div>
    </div>
  );
}

export default ProveedorListToolbar;
