import type { JSX, ReactNode } from 'react';

import type { AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaPageSection.module.scss';

export interface AsistenciaPageSectionProps {
  children?: ReactNode;
  divider?: boolean;
  variant?: 'default' | 'header' | 'body';
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaPageSection({
  children,
  divider = false,
  variant = 'default',
  theme = 'dark',
  className,
}: AsistenciaPageSectionProps): JSX.Element {
  return (
    <section
      className={[
        styles.section,
        styles[`theme--${theme}`],
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

export default AsistenciaPageSection;
