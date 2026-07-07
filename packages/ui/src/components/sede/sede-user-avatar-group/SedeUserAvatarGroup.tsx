import React, { type JSX } from 'react';

import { SedeUserAvatar } from '../sede-user-avatar';
import type { SedeAssignedUser, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeUserAvatarGroup.module.scss';

export interface SedeUserAvatarGroupProps {
  users?: SedeAssignedUser[];
  emptyLabel?: string;
  maxVisible?: number;
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

export function SedeUserAvatarGroup({
  users = [],
  emptyLabel = 'Sin usuarios',
  maxVisible = 3,
  theme = 'dark',
  size = 'md',
  className,
}: SedeUserAvatarGroupProps): JSX.Element {
  if (users.length === 0) {
    return (
      <span
        className={[styles.empty, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      >
        {emptyLabel}
      </span>
    );
  }

  const visible = users.slice(0, maxVisible);

  return (
    <div
      className={[styles.group, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {visible.map((user, index) => (
        <SedeUserAvatar
          key={user.id}
          initials={resolveInitials(user)}
          tone={user.tone ?? (index % 2 === 0 ? 'teal' : 'coral')}
          theme={theme}
          size={size}
          className={index > 0 ? styles.overlap : undefined}
        />
      ))}
    </div>
  );
}

export default SedeUserAvatarGroup;
