import type { JSX } from 'react';

import { ActiveInactiveStatusBadge } from '../../active-inactive-status-badge';
import styles from './ProduccionStatusBadge.module.scss';
import type { ProduccionSize, ProduccionStatus, ProduccionTheme } from '../shared/produccion-types';

const labels: Record<Exclude<ProduccionStatus, 'active' | 'inactive'>, string> = {
  maintenance: 'MANTENIMIENTO',
  published: 'PUBLICADA',
  draft: 'BORRADOR',
  archived: 'ARCHIVADA',
};

export interface ProduccionStatusBadgeProps {
  status?: ProduccionStatus;
  label?: string;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionStatusBadge({
  status = 'active',
  label,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionStatusBadgeProps): JSX.Element {
  if (status === 'active' || status === 'inactive') {
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

  return (
    <span
      className={[
        styles.badge,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`status--${status}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      {label ?? labels[status]}
    </span>
  );
}

export default ProduccionStatusBadge;
