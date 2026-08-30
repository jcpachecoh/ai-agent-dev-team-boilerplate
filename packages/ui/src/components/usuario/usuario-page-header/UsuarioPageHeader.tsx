import type { JSX, ReactNode } from 'react';

import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import styles from './UsuarioPageHeader.module.scss';

export interface UsuarioPageHeaderProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioPageHeader({
  eyebrow,
  title = 'Usuarios',
  subtitle = 'Gestión de cuentas de usuario y asignación de roles',
  icon,
  actions,
  theme = 'dark',
  size = 'md',
  className,
}: UsuarioPageHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.leading}>
        {icon ? (
          <div className={styles.iconWrap} aria-hidden>
            {icon}
          </div>
        ) : null}
        <div className={styles.titles}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

export default UsuarioPageHeader;
