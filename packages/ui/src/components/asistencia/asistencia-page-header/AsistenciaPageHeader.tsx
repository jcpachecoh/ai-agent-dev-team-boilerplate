import type { JSX, ReactNode } from 'react';

import { AsistenciaLiveBadge } from '../asistencia-live-badge';
import type { AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaPageHeader.module.scss';

export interface AsistenciaPageHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  live?: boolean;
  liveLabel?: string;
  syncAction?: ReactNode;
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaPageHeader({
  title = 'Monitor de Asistencia',
  subtitle = 'Tiempo real · Polling cada 30s',
  icon,
  live = true,
  liveLabel,
  syncAction,
  theme = 'dark',
  className,
}: AsistenciaPageHeaderProps): JSX.Element {
  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <div className={styles.leading}>
        <div className={styles.titleRow}>
          {icon ? <span className={styles.iconWrap}>{icon}</span> : null}
          <h1 className={styles.title}>{title}</h1>
          {live ? <AsistenciaLiveBadge theme={theme} label={liveLabel} /> : null}
        </div>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      {syncAction ? <div className={styles.action}>{syncAction}</div> : null}
    </header>
  );
}

export default AsistenciaPageHeader;
