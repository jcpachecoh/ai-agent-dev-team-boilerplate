import { Plus } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioActionButton.module.scss';

export interface UsuarioActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  icon?: ReactNode;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
}

export function UsuarioActionButton({
  label = 'Nuevo usuario',
  icon,
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: UsuarioActionButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={[styles.button, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span className={styles.icon}>{icon ?? <Plus aria-hidden />}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export default UsuarioActionButton;
