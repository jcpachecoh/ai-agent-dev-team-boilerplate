import type { JSX, ReactNode } from 'react';

import type { AsistenciaSize, AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaPage.module.scss';

export interface AsistenciaPageProps {
  children?: ReactNode;
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaPage({
  children,
  theme = 'dark',
  className,
}: AsistenciaPageProps): JSX.Element {
  return (
    <div className={[styles.page, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export default AsistenciaPage;
