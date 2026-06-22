import { Users } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import type { AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaContextBar.module.scss';

export interface AsistenciaContextBarProps {
  summary?: string;
  legend?: ReactNode;
  actions?: ReactNode;
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaContextBar({
  summary = 'SEDE · 0 EMPLEADOS ACTIVOS',
  legend,
  actions,
  theme = 'dark',
  className,
}: AsistenciaContextBarProps): JSX.Element {
  return (
    <div className={[styles.bar, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      <div className={styles.leading}>
        <Users className={styles.icon} aria-hidden />
        <p className={styles.summary}>{summary}</p>
      </div>
      <div className={styles.trailing}>
        {legend ? <div className={styles.legend}>{legend}</div> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </div>
  );
}

export default AsistenciaContextBar;
