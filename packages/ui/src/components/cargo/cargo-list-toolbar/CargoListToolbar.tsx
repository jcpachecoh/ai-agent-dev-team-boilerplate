import type { JSX } from 'react';

import { CargoSearch } from '../cargo-search';
import { CargoStatusFilter } from '../cargo-status-filter';
import styles from './CargoListToolbar.module.scss';
import type { CargoSize, CargoStatusFilterValue, CargoTheme } from '../shared/cargo-types';

export interface CargoListToolbarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: CargoStatusFilterValue;
  onStatusFilterChange?: (filter: CargoStatusFilterValue) => void;
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
}

export function CargoListToolbar({
  searchValue = '',
  searchPlaceholder = 'Buscar por nombre o área…',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  theme = 'dark',
  size = 'md',
  className,
}: CargoListToolbarProps): JSX.Element {
  return (
    <div
      className={[styles.toolbar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <CargoSearch
        value={searchValue}
        placeholder={searchPlaceholder}
        onValueChange={onSearchChange}
        theme={theme}
        size={size}
      />
      <CargoStatusFilter
        activeId={statusFilter}
        onChange={onStatusFilterChange}
        theme={theme}
        size={size}
      />
    </div>
  );
}

export default CargoListToolbar;
