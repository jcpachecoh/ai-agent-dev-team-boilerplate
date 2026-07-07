import { Plus } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

import type { EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import styles from './EmpleadoActionButton.module.scss';

export interface EmpleadoActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  icon?: ReactNode;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
}

export function EmpleadoActionButton({
  label = 'Nuevo empleado',
  icon,
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: EmpleadoActionButtonProps): JSX.Element {
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

export default EmpleadoActionButton;
