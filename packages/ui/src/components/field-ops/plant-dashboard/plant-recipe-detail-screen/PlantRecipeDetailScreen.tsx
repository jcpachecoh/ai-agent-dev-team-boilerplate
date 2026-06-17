import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Flame,
  Package,
  Pause,
  RotateCcw,
  SkipForward,
} from 'lucide-react';
import { useMemo, type JSX } from 'react';

import type { PlantDashboardThemeProps } from '../shared/plant-workstation-types';
import {
  formatPlantElapsed,
  formatPlantStandard,
  resolveRecipePhaseStatuses,
  type PlantRecipeDetail,
  type PlantRecipePhaseIngredient,
  type PlantWorkstationStatus,
} from '../shared/plant-workstation-types';
import styles from './PlantRecipeDetailScreen.module.scss';

export interface PlantRecipeDetailScreenProps extends PlantDashboardThemeProps {
  orderId: string;
  productName: string;
  operatorName: string;
  status: Exclude<PlantWorkstationStatus, 'empty'>;
  recipe: PlantRecipeDetail;
  currentPhaseIndex: number;
  elapsedMs?: number;
  timerRunning?: boolean;
  onBack: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onNextStep?: () => void;
  onFinishOrder?: () => void;
  onReportIssue?: () => void;
  onIngredientTap?: (ingredientId: string) => void;
}

function phaseMetaLabel(durationMinutes: number, ingredientCount: number): string {
  return `${durationMinutes} min · ${ingredientCount} insumo${ingredientCount === 1 ? '' : 's'}`;
}

function SidebarIngredientRow({
  ingredient,
  onTap,
}: {
  ingredient: PlantRecipePhaseIngredient;
  onTap?: (id: string) => void;
}): JSX.Element {
  return (
    <button
      type="button"
      className={[
        styles.sidebarIngredient,
        ingredient.stockWarning && styles.sidebarIngredientWarning,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onTap?.(ingredient.id)}
    >
      <Package size={12} aria-hidden />
      <span className={styles.sidebarIngredientName}>{ingredient.name}</span>
      <span className={styles.sidebarIngredientQty}>{ingredient.quantity}</span>
      {ingredient.stockWarning ? <span className={styles.sidebarStockBadge}>⚠ STOCK</span> : null}
    </button>
  );
}

export function PlantRecipeDetailScreen({
  orderId,
  productName,
  operatorName,
  status,
  recipe,
  currentPhaseIndex,
  elapsedMs = 0,
  timerRunning = false,
  onBack,
  onStart,
  onPause,
  onResume,
  onNextStep,
  onFinishOrder,
  onReportIssue,
  onIngredientTap,
  theme = 'dark',
  className,
}: PlantRecipeDetailScreenProps): JSX.Element {
  const phases = useMemo(
    () => resolveRecipePhaseStatuses(recipe.phases, currentPhaseIndex),
    [recipe.phases, currentPhaseIndex],
  );

  const currentPhase = phases.find((phase) => phase.status === 'current') ?? phases[0];
  const currentIngredients = currentPhase?.ingredients ?? [];
  const hasStockIssue =
    currentPhase?.stockIssue || currentIngredients.some((item) => item.stockWarning);
  const standardMs = (currentPhase?.durationMinutes ?? 0) * 60 * 1000;
  const progressPct =
    standardMs > 0 ? Math.min(100, Math.round((elapsedMs / standardMs) * 100)) : 0;
  const timerMuted = status === 'paused' || status === 'pending' || !timerRunning;
  const showRunningTimer = status === 'in_progress' && timerRunning;

  return (
    <div
      className={[styles.screen, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      data-testid="plant-recipe-detail-screen"
    >
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={14} aria-hidden />
          DASHBOARD
        </button>
        <div className={styles.headerCenter}>
          <Flame size={14} className={styles.flameIcon} aria-hidden />
          <span className={styles.orderId}>{orderId}</span>
          <span className={styles.headerDot}>·</span>
          <span className={styles.productName}>{productName}</span>
        </div>
        <span className={styles.operatorName}>{operatorName}</span>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <p className={styles.sidebarEyebrow}>RECETA</p>
            <h2 className={styles.recipeTitle}>{recipe.recipeName}</h2>
            <p className={styles.recipeMeta}>
              {recipe.phases.length} pasos · {recipe.batchSize} · {recipe.stationId}
            </p>
          </div>

          <div className={styles.phaseList}>
            {phases.map((phase) => (
              <div
                key={phase.id}
                className={[
                  styles.phaseItem,
                  styles[`phaseItem--${phase.status}`],
                  phase.status === 'current' && styles.phaseItemExpanded,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className={styles.phaseRow}>
                  <span className={styles.phaseBadge} aria-hidden>
                    {phase.status === 'completed' ? <Check size={12} /> : phase.index}
                  </span>
                  <div className={styles.phaseCopy}>
                    <div className={styles.phaseTitleRow}>
                      <span className={styles.phaseName}>{phase.name}</span>
                      {phase.status === 'current' ? (
                        <span className={styles.phaseCurrentTag}>← ACTUAL</span>
                      ) : null}
                    </div>
                    <p className={styles.phaseMeta}>
                      {phaseMetaLabel(phase.durationMinutes, phase.ingredients.length)}
                      {phase.stockIssue && phase.status !== 'completed' ? (
                        <span className={styles.phaseStockHint}> ⚠ stock</span>
                      ) : null}
                    </p>
                  </div>
                  {phase.status === 'current' ? (
                    <ChevronDown size={14} className={styles.phaseChevron} aria-hidden />
                  ) : null}
                </div>

                {phase.status === 'current' ? (
                  <div className={styles.phaseExpanded}>
                    {phase.ingredients.map((ingredient) => (
                      <SidebarIngredientRow
                        key={ingredient.id}
                        ingredient={ingredient}
                        onTap={onIngredientTap}
                      />
                    ))}
                    <p className={styles.phaseHint}>Toca un insumo para ver proveedor</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.mainScroll}>
            <div className={styles.stepHeader}>
              <div className={styles.stepLabelRow}>
                <span className={styles.stepLabel}>
                  PASO {currentPhaseIndex} DE {recipe.phases.length}
                </span>
                {hasStockIssue ? (
                  <span className={styles.stockBadge}>⚠ STOCK INSUFICIENTE</span>
                ) : null}
              </div>
              <h1 className={styles.stepTitle}>{currentPhase?.name}</h1>
              {currentPhase?.instruction ? (
                <blockquote className={styles.instruction}>{currentPhase.instruction}</blockquote>
              ) : null}
            </div>

            <section className={styles.suppliesCard}>
              <header className={styles.suppliesHeader}>
                <Package size={12} aria-hidden />
                <span>INSUMOS REQUERIDOS — PASO ACTUAL</span>
              </header>
              <ul className={styles.suppliesList}>
                {currentIngredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className={[
                      styles.supplyRow,
                      ingredient.stockWarning && styles.supplyRowWarning,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className={styles.supplyBullet} aria-hidden />
                    <span className={styles.supplyName}>{ingredient.name}</span>
                    <span className={styles.supplyQty}>{ingredient.quantity}</span>
                    {ingredient.stockWarning ? (
                      <span className={styles.supplyStockTag}>⚠ Stock insuficiente</span>
                    ) : null}
                    {ingredient.supplier ? (
                      <span className={styles.supplySupplier}>{ingredient.supplier}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className={styles.mainFooter}>
            <section
              className={[
                styles.timerCard,
                showRunningTimer && styles.timerCardActive,
                timerMuted && styles.timerCardMuted,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {showRunningTimer ? (
                <>
                  <p className={styles.timerEyebrow}>TIEMPO TRANSCURRIDO</p>
                  <p className={styles.timerValue}>{formatPlantElapsed(elapsedMs)}</p>
                  <div className={styles.timerStats}>
                    <span>Este paso: {formatPlantElapsed(elapsedMs)}</span>
                    <span>Estándar: {formatPlantStandard(standardMs)}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <span className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                  </div>
                </>
              ) : status === 'paused' ? (
                <>
                  <p className={styles.timerStatusMuted}>⏸ PAUSADO</p>
                  <p className={styles.timerValueMuted}>{formatPlantElapsed(elapsedMs)}</p>
                </>
              ) : status === 'pending' ? (
                <>
                  <p className={styles.timerStatusMuted}>NO INICIADO</p>
                  <p className={styles.timerValueMuted}>00:00</p>
                </>
              ) : (
                <>
                  <p className={styles.timerStatusMuted}>⏸ PAUSADO</p>
                  <p className={styles.timerValueMuted}>{formatPlantElapsed(elapsedMs)}</p>
                </>
              )}
            </section>

            <div className={styles.actions}>
              {status === 'pending' ? (
                <button type="button" className={styles.actionStart} onClick={onStart}>
                  INICIAR
                </button>
              ) : (
                <>
                  <div className={styles.actionRow}>
                    {status === 'in_progress' && timerRunning ? (
                      <button type="button" className={styles.actionPause} onClick={onPause}>
                        <Pause size={16} aria-hidden />
                        PAUSAR
                      </button>
                    ) : (
                      <button type="button" className={styles.actionResume} onClick={onResume}>
                        <RotateCcw size={16} aria-hidden />
                        REANUDAR
                      </button>
                    )}
                    <button type="button" className={styles.actionNext} onClick={onNextStep}>
                      <SkipForward size={16} aria-hidden />
                      SIGUIENTE PASO
                    </button>
                    <button type="button" className={styles.actionAlert} onClick={onReportIssue}>
                      <AlertTriangle size={16} aria-hidden />
                    </button>
                  </div>
                  <button type="button" className={styles.actionFinish} onClick={onFinishOrder}>
                    <Check size={16} aria-hidden />
                    FINALIZAR ORDEN
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PlantRecipeDetailScreen;
