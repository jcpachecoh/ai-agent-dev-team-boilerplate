import type { JSX } from 'react';

import { ActiveInactiveStatusBadge } from '../../active-inactive-status-badge';
import type { RolSize, RolTheme } from '../shared/rol-types';

export interface RolStatusBadgeProps {
  active?: boolean;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolStatusBadge({
  active = true,
  theme = 'dark',
  size = 'sm',
  className,
}: RolStatusBadgeProps): JSX.Element {
  return (
    <ActiveInactiveStatusBadge
      active={active}
      theme={theme}
      size={size === 'sm' ? 'sm' : 'md'}
      className={className}
    />
  );
}

export default RolStatusBadge;
