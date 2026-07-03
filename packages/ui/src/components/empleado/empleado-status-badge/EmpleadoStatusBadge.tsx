import type { JSX } from 'react';

import { ActiveInactiveStatusBadge } from '../../active-inactive-status-badge';
import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';

export interface EmpleadoStatusBadgeProps {
  active?: boolean;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoStatusBadge({
  active = true,
  theme = 'dark',
  size = 'sm',
  className,
}: EmpleadoStatusBadgeProps): JSX.Element {
  return (
    <ActiveInactiveStatusBadge
      active={active}
      theme={theme}
      size={size === 'sm' ? 'sm' : 'md'}
      className={className}
    />
  );
}

export default EmpleadoStatusBadge;
