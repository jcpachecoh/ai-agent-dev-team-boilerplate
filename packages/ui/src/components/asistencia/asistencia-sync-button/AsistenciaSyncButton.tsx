import { RefreshCw } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX } from 'react';

import type { AsistenciaSize, AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaSyncButton.module.scss';

export interface AsistenciaSyncButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
}

export function AsistenciaSyncButton({
  label = 'SINCRONIZADO',
  theme = 'dark',
  size = 'sm',
  className,
  type = 'button',
  ...props
}: AsistenciaSyncButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={[styles.button, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <RefreshCw className={styles.icon} aria-hidden />
      {label}
    </button>
  );
}

export default AsistenciaSyncButton;
