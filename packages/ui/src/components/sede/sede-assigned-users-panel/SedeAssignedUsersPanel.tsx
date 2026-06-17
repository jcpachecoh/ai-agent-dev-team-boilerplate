import { UserPlus } from 'lucide-react';
import React, { type JSX } from 'react';

import { SedeActionButton } from '../sede-action-button';
import { SedeAssignedUserRow } from '../sede-assigned-user-row';
import { SedeFormCard } from '../sede-form-card';
import { SedeUserSelect } from '../sede-user-select';
import type {
  SedeAssignUserOption,
  SedeAssignedUser,
  SedeSize,
  SedeTheme,
} from '../shared/sede-types';
import styles from './SedeAssignedUsersPanel.module.scss';

export interface SedeAssignedUsersPanelProps {
  users?: SedeAssignedUser[];
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onRemoveUser?: (userId: string) => void;
  assignableUsers?: SedeAssignUserOption[];
  selectedUserId?: string;
  onSelectedUserChange?: (userId: string) => void;
  onAssignUser?: () => void;
  assignLoading?: boolean;
  assignLabel?: string;
  emptyAssignableMessage?: string;
  description?: string;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeAssignedUsersPanel({
  users = [],
  searchValue = '',
  searchPlaceholder = 'Buscar usuario asignado…',
  onSearchChange,
  onRemoveUser,
  assignableUsers,
  selectedUserId = '',
  onSelectedUserChange,
  onAssignUser,
  assignLoading = false,
  assignLabel = 'Asignar usuario',
  emptyAssignableMessage = 'No hay usuarios disponibles para asignar.',
  description = 'Usuarios con acceso a esta sede. Las asignaciones se guardan al instante.',
  theme = 'dark',
  size = 'md',
  className,
}: SedeAssignedUsersPanelProps): JSX.Element {
  const canAssign = Boolean(onAssignUser && assignableUsers);
  const hasAssignableOptions = (assignableUsers?.length ?? 0) > 0;

  return (
    <SedeFormCard title="Usuarios asignados" theme={theme} size={size} className={className}>
      <p className={[styles.description, styles[`theme--${theme}`]].join(' ')}>{description}</p>

      {canAssign && (
        <div className={[styles.assignBlock, styles[`theme--${theme}`]].join(' ')}>
          <span className={styles.assignLabel}>Agregar usuario</span>
          <div className={styles.assignRow}>
            <div className={styles.assignSelectWrap}>
              <SedeUserSelect
                options={assignableUsers ?? []}
                value={selectedUserId}
                onChange={onSelectedUserChange}
                placeholder={hasAssignableOptions ? 'Seleccionar usuario…' : emptyAssignableMessage}
                disabled={assignLoading || !hasAssignableOptions}
                theme={theme}
                size="sm"
                className={styles.assignSelect}
                aria-label="Seleccionar usuario para asignar"
              />
            </div>
            <div className={styles.assignButtonWrap}>
              <SedeActionButton
                variant="secondary"
                label={assignLabel}
                icon={<UserPlus aria-hidden />}
                theme={theme}
                size={size}
                onClick={onAssignUser}
                loading={assignLoading}
                disabled={!selectedUserId || assignLoading || !hasAssignableOptions}
                className={styles.assignButton}
              />
            </div>
          </div>
        </div>
      )}

      <div className={[styles.search, styles[`theme--${theme}`]].join(' ')}>
        <input
          type="search"
          value={searchValue}
          placeholder={searchPlaceholder}
          onChange={(event) => onSearchChange?.(event.target.value)}
          aria-label={searchPlaceholder}
        />
      </div>
      <div className={styles.list}>
        {users.length === 0 ? (
          <p className={[styles.emptyList, styles[`theme--${theme}`]].join(' ')}>
            Sin usuarios asignados a esta sede.
          </p>
        ) : (
          users.map((user) => (
            <SedeAssignedUserRow
              key={user.id}
              user={user}
              onRemove={onRemoveUser}
              theme={theme}
              size={size}
            />
          ))
        )}
      </div>
      <p className={[styles.footer, styles[`theme--${theme}`]].join(' ')}>
        {users.length} usuario{users.length === 1 ? '' : 's'} asignado
        {users.length === 1 ? '' : 's'}
      </p>
    </SedeFormCard>
  );
}

export default SedeAssignedUsersPanel;
