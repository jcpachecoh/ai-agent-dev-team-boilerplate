import { Plus } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolActionButton.module.scss';

export interface RolActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  icon?: ReactNode;
  theme?: RolTheme;
  size?: RolSize;
}

export function RolActionButton({
  label = 'Nuevo rol',
  icon,
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: RolActionButtonProps): JSX.Element {
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

export default RolActionButton;
