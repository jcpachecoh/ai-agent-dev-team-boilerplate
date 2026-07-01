import type { JSX } from 'react';

import type { EmpleadoAvatarTone, EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoAvatar.module.scss';

export interface EmpleadoAvatarProps {
  initials?: string;
  photoUrl?: string | null;
  tone?: EmpleadoAvatarTone;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoAvatar({
  initials = 'EM',
  photoUrl,
  tone = 'teal',
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoAvatarProps): JSX.Element {
  const baseClass = [
    styles.avatar,
    styles[`theme--${theme}`],
    styles[`size--${size}`],
    photoUrl ? styles['has-photo'] : styles[`tone--${tone}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (photoUrl) {
    return (
      <span className={baseClass} aria-hidden>
        <img src={photoUrl} alt="" className={styles.photo} />
      </span>
    );
  }

  return (
    <span className={baseClass} aria-hidden>
      {initials}
    </span>
  );
}

export default EmpleadoAvatar;
