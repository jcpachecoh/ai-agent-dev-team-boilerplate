import type { JSX, ReactNode } from 'react';

import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioPage.module.scss';

export interface UsuarioPageProps {
  children?: ReactNode;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioPage({
  children,
  theme = 'dark',
  size = 'md',
  className,
}: UsuarioPageProps): JSX.Element {
  return (
    <div
      className={[styles.page, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default UsuarioPage;
