import { Building2, MapPin, Phone } from 'lucide-react';
import React, { type CSSProperties, type JSX } from 'react';

import { EmpleadoRowActionButton } from '../../empleado/empleado-row-action-button';
import { SedeRowActionButton } from '../sede-row-action-button';
import { SedeStatusBadge } from '../sede-status-badge';
import { SedeUserAvatarGroup } from '../sede-user-avatar-group';
import { sedeGridTemplate } from '../shared/sede-columns';
import type { SedeAssignedUser, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeTableRow.module.scss';

export interface SedeTableRowProps {
  id?: string;
  name?: string;
  createdAt?: string;
  address?: string;
  city?: string;
  phone?: string;
  isActive?: boolean;
  assignedUsers?: SedeAssignedUser[];
  onEdit?: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  toggleLoading?: boolean;
  deleteLoading?: boolean;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeTableRow({
  id,
  name = 'Sede Bocagrande',
  createdAt = '2024-04-12',
  address = 'Av. San Martín # 6-40',
  city = 'Cartagena',
  phone = '+57 605 901 2345',
  isActive = true,
  assignedUsers = [],
  onEdit,
  onToggleStatus,
  onDelete,
  toggleLoading = false,
  deleteLoading = false,
  theme = 'dark',
  size = 'md',
  className,
}: SedeTableRowProps): JSX.Element {
  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      data-sede-id={id}
      style={{ '--sede-columns': sedeGridTemplate } as CSSProperties}
    >
      <div className={styles.nameCell} role="cell">
        <span className={styles.nameIcon} aria-hidden>
          <Building2 />
        </span>
        <span className={styles.nameText}>
          <span className={styles.name}>{name}</span>
          {createdAt && <span className={styles.date}>{createdAt}</span>}
        </span>
      </div>
      <div className={styles.addressCell} role="cell">
        <MapPin aria-hidden />
        <span title={address}>{address}</span>
      </div>
      <span className={styles.cityCell} role="cell">
        {city}
      </span>
      <div className={styles.phoneCell} role="cell">
        <Phone aria-hidden />
        <span>{phone}</span>
      </div>
      <div className={styles.usersCell} role="cell">
        <SedeUserAvatarGroup users={assignedUsers} theme={theme} size="sm" />
      </div>
      <div className={styles.statusCell} role="cell">
        <SedeStatusBadge status={isActive ? 'active' : 'inactive'} theme={theme} size="sm" />
      </div>
      <div className={styles.actionsCell} role="cell">
        <EmpleadoRowActionButton variant="edit" theme={theme} size="sm" onClick={onEdit} />
        <EmpleadoRowActionButton
          variant="toggle"
          active={isActive}
          theme={theme}
          size="sm"
          onClick={onToggleStatus}
          disabled={toggleLoading || deleteLoading}
        />
        <SedeRowActionButton
          variant="delete"
          theme={theme}
          onClick={onDelete}
          disabled={deleteLoading || toggleLoading}
        />
      </div>
    </div>
  );
}

export default SedeTableRow;
