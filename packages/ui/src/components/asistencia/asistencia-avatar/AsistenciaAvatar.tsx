import type { JSX } from 'react';

import type {
  AsistenciaAvatarTone,
  AsistenciaSize,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import styles from './AsistenciaAvatar.module.scss';

export interface AsistenciaAvatarProps {
  initials?: string;
  tone?: AsistenciaAvatarTone;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
  className?: string;
}

export function AsistenciaAvatar({
  initials = 'EM',
  tone = 'teal',
  theme = 'dark',
  size = 'sm',
  className,
}: AsistenciaAvatarProps): JSX.Element {
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

export default AsistenciaAvatar;
