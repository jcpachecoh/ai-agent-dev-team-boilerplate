import type { JSX } from 'react';

import { EmpleadoSearch } from '../empleado-search';
import { EmpleadoStatusFilter } from '../empleado-status-filter';
import type {
  EmpleadoSize,
  EmpleadoStatusFilterValue,
  EmpleadoTheme,
} from '../shared/empleado-types';
import styles from './EmpleadoListToolbar.module.scss';

export interface EmpleadoListToolbarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: EmpleadoStatusFilterValue;
  onStatusFilterChange?: (filter: EmpleadoStatusFilterValue) => void;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoListToolbar({
  searchValue = '',
  searchPlaceholder,
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoListToolbarProps): JSX.Element {
  return (
    <div
      className={[styles.toolbar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <EmpleadoSearch
        value={searchValue}
        placeholder={searchPlaceholder}
        onValueChange={onSearchChange}
        theme={theme}
        size={size}
      />
      <EmpleadoStatusFilter
        activeId={statusFilter}
        onChange={onStatusFilterChange}
        theme={theme}
        size={size}
      />
    </div>
  );
}

export default EmpleadoListToolbar;
