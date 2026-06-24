import type { JSX } from 'react';

import { ActiveInactiveStatusBadge } from '../../active-inactive-status-badge';
import type { SedeLocationStatus, SedeSize, SedeTheme } from '../shared/sede-types';

export interface SedeStatusBadgeProps {
  status?: SedeLocationStatus;
  label?: string;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeStatusBadge({
  status = 'active',
  label,
  theme = 'dark',
  size = 'md',
  className,
}: SedeStatusBadgeProps): JSX.Element {
  return (
    <ActiveInactiveStatusBadge
      status={status}
      label={label}
      theme={theme}
      size={size === 'sm' ? 'sm' : 'md'}
      className={className}
    />
  );
}

export default SedeStatusBadge;
