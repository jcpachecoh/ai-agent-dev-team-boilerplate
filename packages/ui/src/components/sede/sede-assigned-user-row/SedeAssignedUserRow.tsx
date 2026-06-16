import { X } from 'lucide-react';
import React, { type JSX } from 'react';

import { SedeUserAvatar } from '../sede-user-avatar';
import type { SedeAssignedUser, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeAssignedUserRow.module.scss';

export interface SedeAssignedUserRowProps {
  user: SedeAssignedUser;
  onRemove?: (userId: string) => void;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

function resolveInitials(user: SedeAssignedUser): string {
  if (user.initials) return user.initials;
  const parts = user.name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function SedeAssignedUserRow({
  user,
  onRemove,
  theme = 'dark',
  size = 'md',
  className,
}: SedeAssignedUserRowProps): JSX.Element {
  const tone = user.tone ?? 'teal';

  return (
    <article
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <SedeUserAvatar initials={resolveInitials(user)} tone={tone} theme={theme} size="xl" />
      <div className={styles.info}>
        <p className={styles.name}>{user.name}</p>
        <p className={styles.email}>{user.email}</p>
      </div>
      <span className={[styles.roleBadge, styles[`roleTone--${tone}`]].join(' ')}>
        {user.roleLabel}
      </span>
      {onRemove && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => onRemove(user.id)}
          aria-label={`Quitar ${user.name}`}
        >
          <X aria-hidden />
        </button>
      )}
    </article>
  );
}

export default SedeAssignedUserRow;
