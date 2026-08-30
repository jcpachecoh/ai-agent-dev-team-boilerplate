import React, { type JSX } from 'react';

import { SedeFilterSegment } from '../sede-filter-segment';
import { SedeSearch } from '../sede-search';
import type { SedeSize, SedeStatusFilter, SedeTheme } from '../shared/sede-types';
import styles from './SedeListToolbar.module.scss';

export interface SedeListToolbarProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: SedeStatusFilter;
  onStatusFilterChange?: (filter: SedeStatusFilter) => void;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeListToolbar({
  searchValue = '',
  searchPlaceholder,
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  theme = 'dark',
  size = 'md',
  className,
}: SedeListToolbarProps): JSX.Element {
  return (
    <div
      className={[styles.toolbar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <SedeSearch
        value={searchValue}
        placeholder={searchPlaceholder}
        onValueChange={onSearchChange}
        theme={theme}
        size={size}
      />
      <SedeFilterSegment
        activeId={statusFilter}
        onChange={onStatusFilterChange}
        theme={theme}
        size={size}
      />
    </div>
  );
}

export default SedeListToolbar;
