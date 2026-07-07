import { Building2, ChevronRight } from 'lucide-react';
import type { JSX } from 'react';

import type { AsistenciaLocationSummary, AsistenciaTheme } from '../shared/asistencia-types';
import { formatMetricFraction } from '../shared/asistencia-utils';
import styles from './AsistenciaLocationCard.module.scss';

export interface AsistenciaLocationCardProps extends AsistenciaLocationSummary {
  theme?: AsistenciaTheme;
  className?: string;
  onSelect?: (locationId: string) => void;
}

export function AsistenciaLocationCard({
  id,
  name,
  city,
  metrics,
  theme = 'dark',
  className,
  onSelect,
}: AsistenciaLocationCardProps): JSX.Element {
  const hasAlerts = metrics.absent > 0 || metrics.lateArrivals > 0;

  return (
    <button
      type="button"
      className={[styles.card, styles[`theme--${theme}`], hasAlerts && styles.cardAlert, className]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect?.(id)}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.iconWrap} aria-hidden>
            <Building2 size={16} strokeWidth={2} />
          </span>
          <p className={styles.name}>{name}</p>
          <ChevronRight className={styles.chevron} size={16} strokeWidth={2} aria-hidden />
        </div>
        <p className={styles.city}>{city || 'Sin ciudad'}</p>
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>En turno</span>
          <span className={[styles.metricValue, styles.metricValueAccent].join(' ')}>
            {formatMetricFraction(metrics.onShift, metrics.total)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Ausentes</span>
          <span
            className={[
              styles.metricValue,
              metrics.absent > 0 ? styles.metricValueDanger : '',
            ].join(' ')}
          >
            {formatMetricFraction(metrics.absent, metrics.total)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Tarde</span>
          <span
            className={[
              styles.metricValue,
              metrics.lateArrivals > 0 ? styles.metricValueWarning : '',
            ].join(' ')}
          >
            {formatMetricFraction(metrics.lateArrivals, metrics.total)}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Horas extra</span>
          <span
            className={[
              styles.metricValue,
              metrics.overtime > 0 ? styles.metricValueWarning : '',
            ].join(' ')}
          >
            {formatMetricFraction(metrics.overtime, metrics.total)}
          </span>
        </div>
      </div>
    </button>
  );
}

export default AsistenciaLocationCard;
