import type { JSX } from 'react';

import { ActiveInactiveStatusBadge } from '../../active-inactive-status-badge';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export interface CargoStatusBadgeProps {
  active?: boolean;
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
}

export function CargoStatusBadge({
  active = true,
  theme = 'dark',
  size = 'sm',
  className,
}: CargoStatusBadgeProps): JSX.Element {
  return (
    <ActiveInactiveStatusBadge
      active={active}
      theme={theme}
      size={size === 'sm' ? 'sm' : 'md'}
      className={className}
    />
  );
}

export default CargoStatusBadge;
