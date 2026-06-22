import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { fetchFreshOrderRecipeView, useOrderRecipe } from '@/hooks/useOrderRecipe';
import { useOrderRuntimeActions } from '@/hooks/useOrderRuntimeActions';
import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { useWorkstationTimerStore } from '@/stores/workstation-timer.store';

function createIdempotencyKey(action: string, orderId: string): string {
  return `${action}:${orderId}:${crypto.randomUUID()}`;
}

export interface UseWorkstationOrderRuntimeOptions {
  cellIndex: number;
  orderId: string | undefined;
  fallbackWorkStationId?: string;
  fallbackStepId?: string;
  fallbackStatus: 'pending' | 'in_progress' | 'paused' | 'incident' | 'completed';
}

export function useWorkstationOrderRuntime({
  cellIndex,
  orderId,
  fallbackWorkStationId,
  fallbackStepId,
  fallbackStatus,
}: UseWorkstationOrderRuntimeOptions) {
  const queryClient = useQueryClient();
  const updateCellStatus = useDashboardLayoutStore((s) => s.updateCellStatus);
  const updateCellSnapshot = useDashboardLayoutStore((s) => s.updateCellSnapshot);

  const {
    recipe,
    productName,
    currentPhaseIndex,
    currentStepId,
    status: apiStatus,
    elapsedSeconds,
    stationId: apiStationId,
  } = useOrderRecipe(orderId);

  const { startMutation, pauseMutation, resumeMutation, completeStepMutation, finishMutation } =
    useOrderRuntimeActions(orderId);

  const elapsedMs = useWorkstationTimerStore((s) => s.timers[cellIndex]?.elapsedMs ?? 0);
  const timerRunning =
    useWorkstationTimerStore((s) => s.timers[cellIndex]?.status === 'running') ?? false;
  const ensureTimer = useWorkstationTimerStore((s) => s.ensureTimer);
  const startTimer = useWorkstationTimerStore((s) => s.startTimer);
  const pauseTimer = useWorkstationTimerStore((s) => s.pauseTimer);
  const resumeTimer = useWorkstationTimerStore((s) => s.resumeTimer);

  const displayStatus = apiStatus ?? fallbackStatus;
  const resolvedWorkStationId = apiStationId ?? fallbackWorkStationId;
  const resolvedStepId = currentStepId ?? fallbackStepId;

  const currentPhaseName =
    recipe?.phases.find((phase) => phase.index === currentPhaseIndex)?.name ??
    recipe?.phases[currentPhaseIndex - 1]?.name;

  useEffect(() => {
    if (!orderId || !recipe) return;

    updateCellSnapshot(orderId, {
      ...(productName ? { productName } : {}),
      recipeName: recipe.recipeName,
      ...(currentPhaseName ? { phaseName: currentPhaseName } : {}),
      phaseIndex: currentPhaseIndex,
      phaseTotal: recipe.phases.length,
      ...(apiStationId ? { workStationId: apiStationId } : {}),
      ...(currentStepId ? { currentStepId } : {}),
      standardDurationMs:
        (recipe.phases.find((phase) => phase.index === currentPhaseIndex)?.durationMinutes ??
          recipe.phases[currentPhaseIndex - 1]?.durationMinutes ??
          0) *
        60 *
        1000,
    });
  }, [
    apiStationId,
    currentPhaseIndex,
    currentPhaseName,
    currentStepId,
    orderId,
    productName,
    recipe,
    updateCellSnapshot,
  ]);

  useEffect(() => {
    if (!orderId || apiStatus === undefined) return;
    if (apiStatus === 'completed') {
      updateCellStatus(orderId, 'completed');
      return;
    }
    if (apiStatus === 'in_progress' || apiStatus === 'paused' || apiStatus === 'pending') {
      updateCellStatus(orderId, apiStatus);
    }
  }, [apiStatus, orderId, updateCellStatus]);

  useEffect(() => {
    if (elapsedSeconds === undefined || displayStatus === 'completed') return;
    ensureTimer(cellIndex, elapsedSeconds * 1000);
    if (displayStatus === 'in_progress') {
      startTimer(cellIndex);
    }
  }, [cellIndex, displayStatus, elapsedSeconds, ensureTimer, startTimer]);

  const handleStart = useCallback(async () => {
    if (!orderId || !resolvedWorkStationId) return;

    await startMutation.mutateAsync({
      workStationId: resolvedWorkStationId,
      idempotencyKey: createIdempotencyKey('start', orderId),
    });
    startTimer(cellIndex);
    updateCellStatus(orderId, 'in_progress');
  }, [cellIndex, orderId, resolvedWorkStationId, startMutation, startTimer, updateCellStatus]);

  const handlePause = useCallback(async () => {
    if (!orderId) return;

    await pauseMutation.mutateAsync({
      idempotencyKey: createIdempotencyKey('pause', orderId),
    });
    pauseTimer(cellIndex);
    updateCellStatus(orderId, 'paused');
  }, [cellIndex, orderId, pauseMutation, pauseTimer, updateCellStatus]);

  const handleResume = useCallback(async () => {
    if (!orderId) return;

    await resumeMutation.mutateAsync({
      idempotencyKey: createIdempotencyKey('resume', orderId),
    });
    resumeTimer(cellIndex);
    updateCellStatus(orderId, 'in_progress');
  }, [cellIndex, orderId, resumeMutation, resumeTimer, updateCellStatus]);

  const handleFinish = useCallback(async () => {
    if (!orderId) return;

    await finishMutation.mutateAsync({
      idempotencyKey: createIdempotencyKey('finish', orderId),
    });
    pauseTimer(cellIndex);
    updateCellStatus(orderId, 'completed');
  }, [cellIndex, finishMutation, orderId, pauseTimer, updateCellStatus]);

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

  const isPending =
    startMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    completeStepMutation.isPending ||
    finishMutation.isPending;

  return {
    displayStatus,
    elapsedMs,
    timerRunning,
    handleStart,
    handlePause,
    handleResume,
    handleNextStep,
    handleFinish,
    isPending,
    canStart: Boolean(resolvedWorkStationId),
    canAdvanceStep: Boolean(resolvedStepId),
  };
}
