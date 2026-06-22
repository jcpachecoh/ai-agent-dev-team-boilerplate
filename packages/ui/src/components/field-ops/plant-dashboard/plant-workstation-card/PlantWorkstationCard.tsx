import { Check, ChevronRight, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { useEffect, useState, type JSX } from 'react';

import type { PlantDashboardThemeProps } from '../shared/plant-workstation-types';
import {
  formatPlantElapsed,
  formatPlantStandard,
  PLANT_STATUS_ACCENT,
  PLANT_STATUS_LABELS,
  type PlantWorkstationDensity,
  type PlantWorkstationSnapshot,
  type PlantWorkstationStatus,
  type PlantWorkstationTab,
} from '../shared/plant-workstation-types';
import styles from './PlantWorkstationCard.module.scss';

const VISIBLE_INGREDIENTS_COMPACT = 2;

export interface PlantWorkstationCardProps extends PlantDashboardThemeProps {
  status: Exclude<PlantWorkstationStatus, 'empty'>;
  snapshot: PlantWorkstationSnapshot;
  density?: PlantWorkstationDensity;
  elapsedMs?: number;
  timerRunning?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onNextStep?: () => void;
  onFinish?: () => void;
  onReportIssue?: () => void;
  onChangeOrder?: () => void;
  onViewRecipe?: () => void;
}

export function PlantWorkstationCard({
  status,
  snapshot,
  density = 'compact',
  elapsedMs = 0,
  timerRunning = false,
  onStart,
  onPause,
  onResume,
  onNextStep,
  onFinish,
  onReportIssue,
  onChangeOrder,
  onViewRecipe,
  theme = 'dark',
  className,
}: PlantWorkstationCardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<PlantWorkstationTab>('process');
  const accent = PLANT_STATUS_ACCENT[status];
  const statusLabel = PLANT_STATUS_LABELS[status];
  const isCompact = density === 'compact';
  const visibleIngredients = isCompact
    ? snapshot.ingredients.slice(0, VISIBLE_INGREDIENTS_COMPACT)
    : snapshot.ingredients;
  const hiddenCount = snapshot.ingredients.length - visibleIngredients.length;
  const timerMuted = status === 'paused' || status === 'pending' || !timerRunning;
  const timerLabel = formatPlantElapsed(elapsedMs);
  const standardLabel = formatPlantStandard(snapshot.standardDurationMs);
  const canFinishOrder = snapshot.phaseIndex >= snapshot.phaseTotal;
  const [armedAction, setArmedAction] = useState<'next' | 'finish' | null>(null);

  useEffect(() => {
    if (!armedAction) return;
    const timeoutId = window.setTimeout(() => setArmedAction(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [armedAction]);

  const handleGuardedAction = (action: 'next' | 'finish', cb?: () => void) => {
    if (!cb) return;
    if (armedAction !== action) {
      setArmedAction(action);
      return;
    }
    setArmedAction(null);
    cb();
  };

  return (
    <article
      className={[
        styles.card,
        styles[`theme--${theme}`],
        styles[`density--${density}`],
        styles[`status--${status}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--status-accent': accent } as React.CSSProperties}
      data-testid="plant-workstation-card"
    >
      <div className={styles.topBar}>
        <div className={styles.opRow}>
          <span className={styles.statusDot} aria-hidden />
          <span className={styles.opId}>{snapshot.orderNumber ?? snapshot.orderId}</span>
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.recipeBtn} onClick={onViewRecipe}>
            VER RECETA
          </button>
          <button type="button" className={styles.changeBtn} onClick={onChangeOrder}>
            CAMBIAR
          </button>
          <span className={styles.statusBadge}>{statusLabel}</span>
        </div>
      </div>

      <h2 className={styles.productTitle}>{snapshot.productName}</h2>

      <div className={styles.tabs}>
        <button
          type="button"
          className={[styles.tab, activeTab === 'process' && styles.tabActive].join(' ')}
          onClick={() => setActiveTab('process')}
        >
          PROCESO
        </button>
        <button
          type="button"
          className={[styles.tab, activeTab === 'incidents' && styles.tabActive].join(' ')}
          onClick={() => setActiveTab('incidents')}
        >
          NOVEDADES
        </button>
      </div>

      {activeTab === 'process' ? (
        <>
          <div className={styles.phaseHeader}>
            <div>
              <p className={styles.recipeName}>{snapshot.recipeName}</p>
              <p className={styles.phaseName}>{snapshot.phaseName}</p>
            </div>
            <p className={styles.phaseCounter}>
              <span>{snapshot.phaseIndex}</span>
              <span className={styles.phaseTotal}> / {snapshot.phaseTotal}</span>
            </p>
          </div>

          <ul className={styles.ingredientList}>
            {visibleIngredients.map((item) => (
              <li key={item.id} className={styles.ingredientItem}>
                <span className={styles.ingredientBullet} aria-hidden />
                <span className={styles.ingredientName}>{item.name}</span>
                <span className={styles.ingredientQty}>{item.quantity}</span>
              </li>
            ))}
            {hiddenCount > 0 ? (
              <li className={styles.moreRow}>
                <ChevronRight size={11} aria-hidden />
                <span>+{hiddenCount} más</span>
              </li>
            ) : null}
          </ul>

          <div className={styles.timerRow}>
            <span className={[styles.timer, timerMuted && styles.timerMuted].join(' ')}>
              {timerLabel}
            </span>
            {status === 'completed' ? (
              <span className={styles.timerMeta}>TERMINADA</span>
            ) : status === 'paused' ? (
              <span className={styles.timerMeta}>⏸ PAUSADO</span>
            ) : status === 'pending' ? (
              <span className={styles.timerMeta}>NO INICIADO</span>
            ) : timerRunning ? (
              <span className={styles.timerMeta}>ESTÁNDAR {standardLabel}</span>
            ) : null}
          </div>

          {snapshot.operatorName ? (
            <div className={styles.operatorRow}>
              <span className={styles.operatorDot} aria-hidden />
              <span>{snapshot.operatorName}</span>
            </div>
          ) : null}
        </>
      ) : (
        <div className={styles.incidentsPlaceholder}>
          <p>Sin novedades registradas</p>
        </div>
      )}

      <div className={styles.actions}>
        {status === 'completed' ? (
          <div className={styles.actionCompleted}>ORDEN TERMINADA</div>
        ) : status === 'pending' ? (
          <button
            type="button"
            className={styles.actionStart}
            onClick={onStart}
            disabled={!onStart}
          >
            INICIAR
          </button>
        ) : (
          <>
            {status === 'in_progress' ? (
              <button type="button" className={styles.actionPause} onClick={onPause}>
                <Pause size={14} aria-hidden />
                PAUSAR
              </button>
            ) : (
              <button type="button" className={styles.actionResume} onClick={onResume}>
                <RotateCcw size={14} aria-hidden />
                REANUDAR
              </button>
            )}
            {!canFinishOrder ? (
              <button
                type="button"
                className={styles.actionNext}
                onClick={() => handleGuardedAction('next', onNextStep)}
                disabled={!onNextStep}
              >
                <SkipForward size={14} aria-hidden />
                {armedAction === 'next' ? 'CONFIRMAR' : 'SIGUIENTE PASO'}
              </button>
            ) : null}
            {canFinishOrder ? (
              <button
                type="button"
                className={styles.actionFinish}
                onClick={() => handleGuardedAction('finish', onFinish)}
                disabled={status !== 'in_progress' && status !== 'paused'}
              >
                <Check size={14} aria-hidden />
                {armedAction === 'finish' ? 'CONFIRMAR' : 'FINALIZAR'}
              </button>
            ) : null}
            <button type="button" className={styles.actionAlert} onClick={onReportIssue}>
              ⚠
            </button>
          </>
        )}
      </div>

      {snapshot.priority === 'urgent' ? <span className={styles.urgentTag}>URGENTE</span> : null}
    </article>
  );
}

export default PlantWorkstationCard;
