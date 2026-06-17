import { AlertTriangle } from 'lucide-react';
import React, { type JSX } from 'react';

import styles from './ProduccionPlantStationCard.module.scss';
import type {
  ProduccionEfficiencyStatus,
  ProduccionOrderPriority,
  ProduccionPlantStationData,
  ProduccionSeverityLevel,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionPlantStationCardProps extends ProduccionPlantStationData {
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
  onClick?: () => void;
}

const PRIORITY_LABELS: Record<ProduccionOrderPriority, string> = {
  normal: 'NORMAL',
  alta: 'ALTA',
  urgente: 'URGENTE',
};

const SEVERITY_LABELS: Record<ProduccionSeverityLevel, string> = {
  medio: 'MEDIO',
  alto: 'ALTO',
  critico: 'CRÍTICO',
};

function resolveEfficiencyStatus(
  progress: number,
  efficiencyStatus?: ProduccionEfficiencyStatus,
): ProduccionEfficiencyStatus {
  if (efficiencyStatus) return efficiencyStatus;
  if (progress > 100) return 'critical';
  if (progress >= 80) return 'warning';
  return 'normal';
}

export function ProduccionPlantStationCard({
  code = 'EST-06',
  name = 'Empaque y Despacho',
  subtitle = 'Sellado y etiquetado',
  orderNumber = 'OP-000016',
  productName = 'Salsas house variedad',
  priority = 'alta',
  quantityLabel = '60 u',
  phaseLabel = 'Fase 3/3',
  progress = 67,
  efficiencyStatus,
  timerLabel = '10:02',
  severity,
  operators = [{ initials: 'FP', tone: 'gold' }],
  operatorCountLabel = '1 op.',
  status = 'active',
  selected = false,
  theme = 'dark',
  size = 'md',
  className,
  onClick,
}: ProduccionPlantStationCardProps): JSX.Element {
  const efficiency = resolveEfficiencyStatus(progress, efficiencyStatus);
  const progressWidth = Math.min(100, Math.max(0, progress));
  const statusDotTone =
    status === 'active' ? efficiency : status === 'maintenance' ? 'warning' : 'muted';

  return (
    <article
      className={[
        styles.card,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`efficiency--${efficiency}`],
        selected && styles.selected,
        onClick && styles.interactive,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <header className={styles.header}>
        <span className={styles.codeBadge}>{code}</span>
        {severity ? (
          <span className={[styles.severityBadge, styles[`severity--${severity}`]].join(' ')}>
            <AlertTriangle size={9} aria-hidden />
            {SEVERITY_LABELS[severity]}
          </span>
        ) : (
          <span aria-hidden />
        )}
      </header>

      <div className={styles.identity}>
        <h3>{name}</h3>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>

      {orderNumber ? (
        <div className={styles.orderRow}>
          <span className={styles.orderNumber}>{orderNumber}</span>
          <span className={styles.separator} aria-hidden />
          <span className={styles.productName}>{productName}</span>
          {priority ? (
            <span className={[styles.priorityBadge, styles[`priority--${priority}`]].join(' ')}>
              {PRIORITY_LABELS[priority]}
            </span>
          ) : null}
          {quantityLabel ? <span className={styles.quantity}>{quantityLabel}</span> : null}
        </div>
      ) : null}

      <div className={styles.progressBlock}>
        <div className={styles.track}>
          <span style={{ width: `${progressWidth}%` }} />
        </div>
        <div className={styles.progressMeta}>
          {phaseLabel ? <span>{phaseLabel}</span> : <span />}
          <span className={styles.progressValue}>{progress}%</span>
        </div>
      </div>

      {timerLabel ? (
        <p className={[styles.timer, efficiency === 'critical' && styles.timerCritical].join(' ')}>
          {timerLabel}
        </p>
      ) : null}

      <footer className={styles.footer}>
        <div className={styles.operators}>
          {operators.length > 0 ? (
            <>
              <div className={styles.avatarStack}>
                {operators.slice(0, 3).map((operator, index) => (
                  <span
                    key={`${operator.initials}-${index}`}
                    className={[
                      styles.avatar,
                      operator.tone ? styles[`avatar--${operator.tone}`] : styles['avatar--gold'],
                    ].join(' ')}
                  >
                    {operator.initials}
                  </span>
                ))}
              </div>
              <span className={styles.operatorCount}>{operators.length} op.</span>
            </>
          ) : operatorCountLabel ? (
            <span className={styles.operatorCount}>{operatorCountLabel}</span>
          ) : null}
        </div>
        <div className={styles.liveStatus}>
          <span className={[styles.statusDot, styles[`statusDot--${statusDotTone}`]].join(' ')} />
          <span>
            {status === 'active' ? 'ACTIVO' : status === 'maintenance' ? 'MANT.' : 'INACTIVO'}
          </span>
        </div>
      </footer>
    </article>
  );
}

export default ProduccionPlantStationCard;
