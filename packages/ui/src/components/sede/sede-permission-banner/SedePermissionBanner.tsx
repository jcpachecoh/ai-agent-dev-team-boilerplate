import { Info } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import type { SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedePermissionBanner.module.scss';

export interface SedePermissionBannerProps {
  message?: ReactNode;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedePermissionBanner({
  message,
  theme = 'dark',
  size = 'md',
  className,
}: SedePermissionBannerProps): JSX.Element {
  return (
    <aside
      className={[styles.banner, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="note"
    >
      <Info aria-hidden />
      <p className={styles.message}>
        {message ?? (
          <>
            Ruta protegida — Solo usuarios con rol <strong>Supervisor</strong> o{' '}
            <strong>Admin</strong> pueden gestionar sedes.
          </>
        )}
      </p>
    </aside>
  );
}

export default SedePermissionBanner;
