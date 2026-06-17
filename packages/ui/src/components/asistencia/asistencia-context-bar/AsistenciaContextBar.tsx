import { Users } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import type { AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaContextBar.module.scss';

export interface AsistenciaContextBarProps {
  summary?: string;
  legend?: ReactNode;
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaContextBar({
  summary = 'SEDE · 0 EMPLEADOS ACTIVOS',
  legend,
  theme = 'dark',
  className,
}: AsistenciaContextBarProps): JSX.Element {
  return (
    <div className={[styles.bar, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      <div className={styles.leading}>
        <Users className={styles.icon} aria-hidden />
        <p className={styles.summary}>{summary}</p>
      </div>
      {legend ? <div className={styles.legend}>{legend}</div> : null}
    </div>
  );
}

export default AsistenciaContextBar;
