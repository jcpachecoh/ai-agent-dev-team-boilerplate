import { Building2, ChevronRight } from 'lucide-react';
import type { JSX } from 'react';

import type { AsistenciaLocationSummary, AsistenciaTheme } from '../shared/asistencia-types';
import { formatMetricFraction } from '../shared/asistencia-utils';
import styles from './AsistenciaLocationList.module.scss';

export interface AsistenciaLocationListRowProps extends AsistenciaLocationSummary {
  theme?: AsistenciaTheme;
  className?: string;
  onSelect?: (locationId: string) => void;
}

export function AsistenciaLocationListRow({
  id,
  name,
  city,
  metrics,
  theme = 'dark',
  className,
  onSelect,
}: AsistenciaLocationListRowProps): JSX.Element {
  const hasAlerts = metrics.absent > 0 || metrics.lateArrivals > 0;

  return (
    <button
      type="button"
      className={[styles.row, styles[`theme--${theme}`], hasAlerts && styles.rowAlert, className]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect?.(id)}
    >
      <div className={styles.nameCell}>
        <span className={styles.nameIcon} aria-hidden>
          <Building2 size={14} strokeWidth={2} />
        </span>
        <div className={styles.identity}>
          <span className={styles.name}>{name}</span>
          <span className={styles.city}>{city || 'Sin ciudad'}</span>
        </div>
      </div>
      <span className={styles.cityCell}>{city || 'Sin ciudad'}</span>
      <span className={[styles.metricCell, styles.metricAccent].join(' ')}>
        {formatMetricFraction(metrics.onShift, metrics.total)}
      </span>
      <span
        className={[styles.metricCell, metrics.absent > 0 ? styles.metricDanger : ''].join(' ')}
      >
        {formatMetricFraction(metrics.absent, metrics.total)}
      </span>
      <span
        className={[styles.metricCell, metrics.lateArrivals > 0 ? styles.metricWarning : ''].join(
          ' ',
        )}
      >
        {formatMetricFraction(metrics.lateArrivals, metrics.total)}
      </span>
      <span
        className={[styles.metricCell, metrics.overtime > 0 ? styles.metricWarning : ''].join(' ')}
      >
        {formatMetricFraction(metrics.overtime, metrics.total)}
      </span>
      <span className={styles.chevronCell} aria-hidden>
        <ChevronRight size={16} strokeWidth={2} />
      </span>
    </button>
  );
}

export default AsistenciaLocationListRow;
