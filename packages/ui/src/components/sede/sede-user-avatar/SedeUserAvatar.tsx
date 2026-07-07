import React, { type JSX } from 'react';

import type { SedeSize, SedeUserAvatarTone, SedeTheme } from '../shared/sede-types';
import styles from './SedeUserAvatar.module.scss';

export interface SedeUserAvatarProps {
  initials?: string;
  tone?: SedeUserAvatarTone;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeUserAvatar({
  initials = 'AL',
  tone = 'teal',
  theme = 'dark',
  size = 'md',
  className,
}: SedeUserAvatarProps): JSX.Element {
  return (
    <span
      className={[
        styles.avatar,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`tone--${tone}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export default SedeUserAvatar;
