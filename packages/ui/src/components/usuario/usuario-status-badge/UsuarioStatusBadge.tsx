import type { JSX } from 'react';

import { ActiveInactiveStatusBadge } from '../../active-inactive-status-badge';
import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';

export interface UsuarioStatusBadgeProps {
  active?: boolean;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioStatusBadge({
  active = true,
  theme = 'dark',
  size = 'sm',
  className,
}: UsuarioStatusBadgeProps): JSX.Element {
  return (
    <ActiveInactiveStatusBadge
      active={active}
      theme={theme}
      size={size === 'sm' ? 'sm' : 'md'}
      className={className}
    />
  );
}

export default UsuarioStatusBadge;
