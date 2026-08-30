import type { JSX } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolCodeChip.module.scss';

export interface RolCodeChipProps {
  code: string;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolCodeChip({
  code,
  theme = 'dark',
  size = 'sm',
  className,
}: RolCodeChipProps): JSX.Element {
  return (
    <span
      className={[styles.chip, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {code}
    </span>
  );
}

export default RolCodeChip;
