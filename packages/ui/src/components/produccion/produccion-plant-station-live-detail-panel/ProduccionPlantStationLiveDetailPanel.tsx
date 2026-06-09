import { AlertTriangle, Eye, Pause, X } from 'lucide-react';
import React, { type JSX } from 'react';

import styles from './ProduccionPlantStationLiveDetailPanel.module.scss';
import type {
  ProduccionPlantStationLiveDetailData,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionPlantStationLiveDetailPanelProps extends ProduccionPlantStationLiveDetailData {
  onClose?: () => void;
  onPause?: () => void;
  onEscalate?: () => void;
  onViewOrder?: () => void;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionPlantStationLiveDetailPanel({
  code = 'EST-01',
  name = 'Mise en place',
  productName = 'Pollo asado porcionado',
  timerLabel = '09:48',
  standardTimeLabel = 'Estándar: 15:00 · 65%',
  progress = 65,
  efficiencyStatus = 'normal',
  exceeded = false,
  phases = [
    { order: 1, name: 'Recepción insumos', status: 'in_progress' },
    { order: 2, name: 'Preparación de insumos', status: 'pending' },
    { order: 3, name: 'Control calidad', status: 'pending' },
  ],
  orderNumber = 'OP-000012',
  goalLabel = '50 kg',
  operators = [
    {
      initials: 'CM',
      name: 'Carlos Mendoza',
      roleLabel: 'Operador',
      timerLabel: '47:30',
      tone: 'gold',
    },
  ],
  onClose,
  onPause,
  onEscalate,
  onViewOrder,
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionPlantStationLiveDetailPanelProps): JSX.Element {
  const progressWidth = Math.min(100, Math.max(0, progress));

  return (
    <aside
      className={[
        styles.panel,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        styles[`efficiency--${efficiencyStatus}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className={styles.kicker}>Detalle de estación</p>

      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.codeBadge}>{code}</span>
          <div>
            <h3>{name}</h3>
            {productName ? <p className={styles.product}>{productName}</p> : null}
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Cerrar detalle"
          >
            <X aria-hidden />
          </button>
        ) : null}
      </header>

      <section className={styles.timerBlock}>
        <div className={styles.timerTop}>
          <span>Tiempo fase actual</span>
          {exceeded ? (
            <span className={styles.exceededBadge}>
              <AlertTriangle size={10} aria-hidden />
              EXCEDIDO
            </span>
          ) : null}
        </div>
        <p className={styles.timer}>{timerLabel}</p>
        {standardTimeLabel ? <p className={styles.standard}>{standardTimeLabel}</p> : null}
        <div className={styles.track}>
          <span style={{ width: `${progressWidth}%` }} />
        </div>
      </section>

      {phases?.length ? (
        <section className={styles.phases}>
          <p className={styles.sectionTitle}>Fases de producción</p>
          <ol>
            {phases.map((phase) => (
              <li
                key={phase.order}
                className={[styles.phaseItem, styles[`phase--${phase.status}`]].join(' ')}
              >
                <span className={styles.phaseMarker} aria-hidden />
                <div>
                  <strong>
                    {phase.order}. {phase.name}
                  </strong>
                  {phase.status === 'in_progress' ? (
                    <span className={styles.phaseStatus}>EN CURSO</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {orderNumber ? (
        <section className={styles.orderBlock}>
          <p className={styles.sectionTitle}>Orden / meta</p>
          <div className={styles.orderRow}>
            <span>{orderNumber}</span>
            {goalLabel ? <strong>{goalLabel}</strong> : null}
          </div>
        </section>
      ) : null}

      {operators?.length ? (
        <section className={styles.operators}>
          <p className={styles.sectionTitle}>Operadores activos</p>
          {operators.map((operator) => (
            <article key={`${operator.initials}-${operator.name}`} className={styles.operatorRow}>
              <span
                className={[
                  styles.avatar,
                  operator.tone ? styles[`avatar--${operator.tone}`] : styles['avatar--gold'],
                ].join(' ')}
              >
                {operator.initials}
              </span>
              <div>
                <strong>{operator.name}</strong>
                <p>{operator.roleLabel}</p>
              </div>
              <span className={styles.operatorTimer}>{operator.timerLabel}</span>
            </article>
          ))}
        </section>
      ) : null}

      <footer className={styles.actions}>
        <button type="button" className={styles.secondaryAction} onClick={onPause}>
          <Pause size={14} aria-hidden />
          Pausar
        </button>
        <button type="button" className={styles.dangerAction} onClick={onEscalate}>
          <AlertTriangle size={14} aria-hidden />
          Escalar
        </button>
        <button type="button" className={styles.primaryAction} onClick={onViewOrder}>
          <Eye size={14} aria-hidden />
          Ver OP
        </button>
      </footer>
    </aside>
  );
}

export default ProduccionPlantStationLiveDetailPanel;
