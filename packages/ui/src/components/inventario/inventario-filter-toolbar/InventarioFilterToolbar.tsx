import React, { type ChangeEvent, type JSX, type ReactNode } from 'react';

import { InventarioSearch } from '../inventario-search/InventarioSearch';
import {
  InventarioSelect,
  type InventarioSelectOption,
} from '../inventario-select/InventarioSelect';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioFilterToolbar.module.scss';

export interface InventarioFilterToolbarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  categoryOptions?: InventarioSelectOption[];
  categoryValue?: string;
  onCategoryChange?: (value: string) => void;
  supplierOptions?: InventarioSelectOption[];
  supplierValue?: string;
  onSupplierChange?: (value: string) => void;
  categoryFilter?: ReactNode;
  supplierFilter?: ReactNode;
  statusOptions?: InventarioSelectOption[];
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  lowStockOnly?: boolean;
  onLowStockChange?: (checked: boolean) => void;
  lowStockLabel?: string;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const defaultCategoryOptions: InventarioSelectOption[] = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'meats', label: 'Carnes' },
  { value: 'grains', label: 'Granos' },
];

const defaultSupplierOptions: InventarioSelectOption[] = [
  { value: 'all', label: 'Todos los proveedores' },
  { value: 'agrosuper', label: 'Agrosuper' },
];

export function InventarioFilterToolbar({
  searchValue = '',
  searchPlaceholder = 'Buscar por SKU o nombre...',
  onSearchChange,
  categoryOptions = defaultCategoryOptions,
  categoryValue = 'all',
  onCategoryChange,
  supplierOptions = defaultSupplierOptions,
  supplierValue = 'all',
  onSupplierChange,
  categoryFilter,
  supplierFilter,
  statusOptions,
  statusValue = 'all',
  onStatusChange,
  lowStockOnly = false,
  onLowStockChange,
  lowStockLabel = 'Stock Bajo',
  theme = 'light',
  size = 'md',
  className,
}: InventarioFilterToolbarProps): JSX.Element {
  const handleLowStock = (event: ChangeEvent<HTMLInputElement>) => {
    onLowStockChange?.(event.target.checked);
  };

  return (
    <div
      className={[styles.toolbar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <InventarioSearch
        value={searchValue}
        placeholder={searchPlaceholder}
        onChange={onSearchChange}
        theme={theme}
        size={size === 'xl' ? 'md' : size}
        className={styles.search}
      />
      <div className={styles.filterSlot}>
        {categoryFilter ?? (
          <InventarioSelect
            options={categoryOptions}
            value={categoryValue}
            onChange={onCategoryChange}
            theme={theme}
            size={size === 'xl' ? 'md' : size}
            aria-label="Filtrar por categoría"
          />
        )}
      </div>
      <div className={styles.filterSlot}>
        {supplierFilter ?? (
          <InventarioSelect
            options={supplierOptions}
            value={supplierValue}
            onChange={onSupplierChange}
            theme={theme}
            size={size === 'xl' ? 'md' : size}
            aria-label="Filtrar por proveedor"
          />
        )}
      </div>
      {statusOptions && onStatusChange ? (
        <div className={styles.filterSlot}>
          <InventarioSelect
            options={statusOptions}
            value={statusValue}
            onChange={onStatusChange}
            theme={theme}
            size={size === 'xl' ? 'md' : size}
            aria-label="Filtrar por estado"
          />
        </div>
      ) : null}
      <label className={styles.checkbox}>
        <input type="checkbox" checked={lowStockOnly} onChange={handleLowStock} />
        <span>{lowStockLabel}</span>
      </label>
    </div>
  );
}

export default InventarioFilterToolbar;
