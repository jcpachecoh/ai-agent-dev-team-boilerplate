import { PlantRecipeDetailScreen } from '@restopsiq/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState, type JSX } from 'react';

import { fetchFreshOrderRecipeView, useOrderRecipe } from '@/hooks/useOrderRecipe';
import { useOrderRuntimeActions } from '@/hooks/useOrderRuntimeActions';
import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { useWorkstationTimerStore } from '@/stores/workstation-timer.store';

import styles from './RecipeDetailHost.module.scss';

export interface RecipeDetailHostProps {
  cellIndex: number | null;
  operatorName: string;
  onBack: () => void;
  onReportIssue?: (cellIndex: number) => void;
}

function createIdempotencyKey(action: string, orderId: string): string {
  return `${action}:${orderId}:${crypto.randomUUID()}`;
}

export function RecipeDetailHost({
  cellIndex,
  operatorName,
  onBack,
  onReportIssue,
}: RecipeDetailHostProps): JSX.Element | null {
  const cell =
    useDashboardLayoutStore((s) =>
      cellIndex === null ? null : s.cells.find((item) => item.cellIndex === cellIndex),
    ) ?? null;
  const updateCellStatus = useDashboardLayoutStore((s) => s.updateCellStatus);
  const updateCellSnapshot = useDashboardLayoutStore((s) => s.updateCellSnapshot);
  const queryClient = useQueryClient();

  const orderId = cell?.orderId;
  const {
    recipe,
    productName,
    currentPhaseIndex,
    status: apiStatus,
    elapsedSeconds,
    currentStepId,
    stationId,
    isLoading,
    isError,
    refetch,
  } = useOrderRecipe(orderId);

  const { startMutation, pauseMutation, resumeMutation, completeStepMutation, finishMutation } =
    useOrderRuntimeActions(orderId);

  const elapsedMs = useWorkstationTimerStore((s) =>
    cellIndex === null ? 0 : (s.timers[cellIndex]?.elapsedMs ?? 0),
  );
  const timerRunning =
    useWorkstationTimerStore((s) =>
      cellIndex === null ? false : s.timers[cellIndex]?.status === 'running',
    ) ?? false;
  const ensureTimer = useWorkstationTimerStore((s) => s.ensureTimer);
  const startTimer = useWorkstationTimerStore((s) => s.startTimer);
  const pauseTimer = useWorkstationTimerStore((s) => s.pauseTimer);
  const resumeTimer = useWorkstationTimerStore((s) => s.resumeTimer);

  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const displayStatus: 'pending' | 'in_progress' | 'paused' | 'incident' | 'completed' =
    apiStatus ?? (cell == null || cell.status === 'empty' ? 'pending' : cell.status);

  useEffect(() => {
    if (apiStatus === 'completed' && orderId) {
      updateCellStatus(orderId, 'completed');
    }
  }, [apiStatus, orderId, updateCellStatus]);

  useEffect(() => {
    if (cellIndex === null || elapsedSeconds === undefined || displayStatus === 'completed') return;
    ensureTimer(cellIndex, elapsedSeconds * 1000);
    if (displayStatus === 'in_progress') {
      startTimer(cellIndex);
    }
  }, [cellIndex, displayStatus, elapsedSeconds, ensureTimer, startTimer]);

  const handleStart = useCallback(async () => {
    if (!orderId || cellIndex === null) return;
    const workStationId = stationId ?? cell.snapshot?.workStationId;
    if (!workStationId) return;

    await startMutation.mutateAsync({
      workStationId,
      idempotencyKey: createIdempotencyKey('start', orderId),
    });
    startTimer(cellIndex);
    updateCellStatus(orderId, 'in_progress');
  }, [
    cell?.snapshot?.workStationId,
    cellIndex,
    orderId,
    startMutation,
    startTimer,
    stationId,
    updateCellStatus,
  ]);

  const handlePause = useCallback(async () => {
    if (!orderId || cellIndex === null) return;

    await pauseMutation.mutateAsync({
      idempotencyKey: createIdempotencyKey('pause', orderId),
    });
    pauseTimer(cellIndex);
    updateCellStatus(orderId, 'paused');
  }, [cellIndex, orderId, pauseMutation, pauseTimer, updateCellStatus]);

  const handleResume = useCallback(async () => {
    if (!orderId || cellIndex === null) return;

    await resumeMutation.mutateAsync({
      idempotencyKey: createIdempotencyKey('resume', orderId),
    });
    resumeTimer(cellIndex);
    updateCellStatus(orderId, 'in_progress');
  }, [cellIndex, orderId, resumeMutation, resumeTimer, updateCellStatus]);

  const handleNextStep = useCallback(async () => {
    if (!orderId) return;

    const freshView = await fetchFreshOrderRecipeView(queryClient, orderId);
    const stepId = freshView.currentStepId;
    if (!stepId) return;

    await completeStepMutation.mutateAsync({
      stepId,
      actualMinutes: Math.max(1, Math.round(elapsedMs / 60_000)),
      idempotencyKey: createIdempotencyKey('complete-step', orderId),
    });

    const refreshedView = await fetchFreshOrderRecipeView(queryClient, orderId);
    updateCellSnapshot(orderId, {
      phaseIndex: refreshedView.currentPhaseIndex,
      ...(refreshedView.currentStepId ? { currentStepId: refreshedView.currentStepId } : {}),
      ...(refreshedView.stationId ? { workStationId: refreshedView.stationId } : {}),
    });
  }, [completeStepMutation, elapsedMs, orderId, queryClient, updateCellSnapshot]);

  const handleFinishRequest = useCallback(() => {
    setShowFinishConfirm(true);
  }, []);

  const handleFinishConfirm = useCallback(async () => {
    if (!orderId) return;

    await finishMutation.mutateAsync({
      idempotencyKey: createIdempotencyKey('finish', orderId),
    });
    updateCellStatus(orderId, 'completed');
    setShowFinishConfirm(false);
    onBack();
  }, [finishMutation, onBack, orderId, updateCellStatus]);

  if (cellIndex === null || !cell?.snapshot || cell.status === 'empty') {
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.state} data-testid="recipe-detail-loading">
        Cargando receta…
      </div>
    );
  }

  if (isError || !recipe) {
    return (
      <div className={styles.state} data-testid="recipe-detail-error">
        <p>No se pudo cargar la receta.</p>
        <button type="button" onClick={() => void refetch()}>
          Reintentar
        </button>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <>
      <PlantRecipeDetailScreen
        orderId={cell.snapshot.orderNumber ?? cell.snapshot.orderId}
        productName={productName ?? cell.snapshot.productName}
        operatorName={cell.snapshot.operatorName ?? operatorName}
        status={displayStatus === 'incident' ? 'paused' : displayStatus}
        recipe={recipe}
        currentPhaseIndex={displayStatus === 'completed' ? recipe.phases.length : currentPhaseIndex}
        elapsedMs={elapsedMs}
        timerRunning={displayStatus === 'completed' ? false : timerRunning}
        onBack={onBack}
        onStart={displayStatus === 'completed' ? undefined : () => void handleStart()}
        onPause={displayStatus === 'completed' ? undefined : () => void handlePause()}
        onResume={displayStatus === 'completed' ? undefined : () => void handleResume()}
        onNextStep={displayStatus === 'completed' ? undefined : () => void handleNextStep()}
        onFinishOrder={displayStatus === 'completed' ? undefined : handleFinishRequest}
        onReportIssue={
          onReportIssue && cellIndex !== null ? () => onReportIssue(cellIndex) : undefined
        }
      />

      {showFinishConfirm ? (
        <div className={styles.finishOverlay} role="dialog" aria-modal="true">
          <div className={styles.finishDialog}>
            <h2>¿Finalizar orden?</h2>
            <p>Confirma que todos los pasos están completos antes de cerrar la orden.</p>
            <div className={styles.finishActions}>
              <button type="button" onClick={() => setShowFinishConfirm(false)}>
                Cancelar
              </button>
              <button type="button" onClick={() => void handleFinishConfirm()}>
                Finalizar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default RecipeDetailHost;
