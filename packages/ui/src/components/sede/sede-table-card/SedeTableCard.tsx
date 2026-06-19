import { Building2, MapPin, Phone } from 'lucide-react';
import React, { type JSX } from 'react';

import { SedeRowActionButton } from '../sede-row-action-button';
import { SedeStatusBadge } from '../sede-status-badge';
import { SedeUserAvatarGroup } from '../sede-user-avatar-group';
import type { SedeAssignedUser, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeTableCard.module.scss';

export interface SedeTableCardProps {
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

export function SedeTableCard({
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
  theme = 'light',
  size = 'md',
  className,
}: SedeTableCardProps): JSX.Element {
  return (
    <article
      className={[styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      data-sede-id={id}
    >
      <header className={styles.header}>
        <div className={styles.nameBlock}>
          <span className={styles.nameIcon} aria-hidden>
            <Building2 />
          </span>
          <div className={styles.nameText}>
            <p className={styles.name}>{name}</p>
            {createdAt && <p className={styles.date}>{createdAt}</p>}
          </div>
        </div>
        <SedeStatusBadge status={isActive ? 'active' : 'inactive'} theme={theme} size="sm" />
      </header>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>Dirección</dt>
          <dd>
            <MapPin aria-hidden />
            <span>{address}</span>
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Ciudad</dt>
          <dd>{city}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Teléfono</dt>
          <dd>
            <Phone aria-hidden />
            <span>{phone}</span>
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Usuarios</dt>
          <dd>
            <SedeUserAvatarGroup users={assignedUsers} theme={theme} size="sm" />
          </dd>
        </div>
      </dl>

      <footer className={styles.footer}>
        <SedeRowActionButton variant="edit" theme={theme} onClick={onEdit} />
        <SedeRowActionButton
          variant="toggle"
          active={isActive}
          theme={theme}
          onClick={onToggleStatus}
          disabled={toggleLoading || deleteLoading}
        />
        <SedeRowActionButton
          variant="delete"
          theme={theme}
          onClick={onDelete}
          disabled={deleteLoading || toggleLoading}
        />
      </footer>
    </article>
  );
}

export default SedeTableCard;
