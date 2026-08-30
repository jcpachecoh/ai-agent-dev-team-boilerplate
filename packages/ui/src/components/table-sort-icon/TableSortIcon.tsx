import { ChevronDown, ChevronUp } from 'lucide-react';
import type { JSX } from 'react';

export type TableSortDirection = 'asc' | 'desc' | null | undefined;

export interface TableSortIconProps {
  direction?: TableSortDirection;
  size?: number;
  inactiveClassName?: string;
}

export function TableSortIcon({
  direction = null,
  size = 10,
  inactiveClassName,
}: TableSortIconProps): JSX.Element {
  if (direction === 'asc') {
    return <ChevronUp size={size} aria-hidden />;
  }

  if (direction === 'desc') {
    return <ChevronDown size={size} aria-hidden />;
  }

  return <ChevronDown size={size} aria-hidden className={inactiveClassName} />;
}

export default TableSortIcon;
