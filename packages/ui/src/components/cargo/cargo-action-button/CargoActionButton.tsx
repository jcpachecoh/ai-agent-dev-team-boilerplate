import { Plus } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

import styles from './CargoActionButton.module.scss';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';

export interface CargoActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label?: string;
  icon?: ReactNode;
  theme?: CargoTheme;
  size?: CargoSize;
}

export function CargoActionButton({
  label = 'Nuevo cargo',
  icon,
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: CargoActionButtonProps): JSX.Element {
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

export default CargoActionButton;
