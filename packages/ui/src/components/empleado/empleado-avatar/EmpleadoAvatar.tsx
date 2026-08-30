import type { JSX } from 'react';

import type { EmpleadoAvatarTone, EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoAvatar.module.scss';

export interface EmpleadoAvatarProps {
  initials?: string;
  tone?: EmpleadoAvatarTone;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

export function EmpleadoAvatar({
  initials = 'EM',
  tone = 'teal',
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoAvatarProps): JSX.Element {
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

export default EmpleadoAvatar;
