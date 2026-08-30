import type { JSX, ReactNode } from 'react';

import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioPageSection.module.scss';

export interface UsuarioPageSectionProps {
  children?: ReactNode;
  divider?: boolean;
  variant?: 'default' | 'header' | 'toolbar' | 'body';
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioPageSection({
  children,
  divider = false,
  variant = 'default',
  theme = 'dark',
  size = 'md',
  className,
}: UsuarioPageSectionProps): JSX.Element {
  return (
    <section
      className={[
        styles.section,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`variant--${variant}`],
        divider && styles.divider,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  );
}

export default UsuarioPageSection;
