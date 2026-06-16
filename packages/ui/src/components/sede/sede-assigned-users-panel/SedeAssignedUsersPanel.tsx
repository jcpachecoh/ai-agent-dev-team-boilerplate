import { Search } from 'lucide-react';
import React, { type JSX } from 'react';

import { SedeAssignedUserRow } from '../sede-assigned-user-row';
import { SedeFormCard } from '../sede-form-card';
import type { SedeAssignedUser, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeAssignedUsersPanel.module.scss';

export interface SedeAssignedUsersPanelProps {
  users?: SedeAssignedUser[];
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onRemoveUser?: (userId: string) => void;
  description?: string;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeAssignedUsersPanel({
  users = [],
  searchValue = '',
  searchPlaceholder = 'Buscar usuario por nombre, email o rol...',
  onSearchChange,
  onRemoveUser,
  description = 'Usuarios con acceso a esta sede. Los cambios se guardan al enviar el formulario.',
  theme = 'dark',
  size = 'md',
  className,
}: SedeAssignedUsersPanelProps): JSX.Element {
  return (
    <SedeFormCard title="Usuarios asignados" theme={theme} size={size} className={className}>
      <p className={[styles.description, styles[`theme--${theme}`]].join(' ')}>{description}</p>
      <div className={[styles.search, styles[`theme--${theme}`]].join(' ')}>
        <Search aria-hidden />
        <input
          type="search"
          value={searchValue}
          placeholder={searchPlaceholder}
          onChange={(event) => onSearchChange?.(event.target.value)}
        />
      </div>
      <div className={styles.list}>
        {users.map((user) => (
          <SedeAssignedUserRow
            key={user.id}
            user={user}
            onRemove={onRemoveUser}
            theme={theme}
            size={size}
          />
        ))}
      </div>
      <p className={[styles.footer, styles[`theme--${theme}`]].join(' ')}>
        {users.length} usuario{users.length === 1 ? '' : 's'} asignado
        {users.length === 1 ? '' : 's'}
      </p>
    </SedeFormCard>
  );
}

export default SedeAssignedUsersPanel;
