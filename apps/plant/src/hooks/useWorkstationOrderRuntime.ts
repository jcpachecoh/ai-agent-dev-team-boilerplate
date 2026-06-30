import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { fetchFreshOrderRecipeView, useOrderRecipe } from '@/hooks/useOrderRecipe';
import { useOrderRuntimeActions } from '@/hooks/useOrderRuntimeActions';
import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { useWorkstationTimerStore } from '@/stores/workstation-timer.store';
import {
  isPlantApiConflictWithMessage,
  isPlantApiNotFoundWithMessage,
} from '@/utils/plant-api-conflict';
import {
  buildSnapshotPatchFromOrderView,
  mapOrderViewToCellStatus,
  resolveOrderStepId,
} from '@/utils/syncOrderViewToCell';

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
    isLoading: isRecipeLoading,
    isSuccess: isRecipeReady,
    data: orderView,
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
  const didInitialSyncRef = useRef(false);

  const displayStatus = apiStatus ?? fallbackStatus;
  const resolvedWorkStationId = apiStationId ?? fallbackWorkStationId;
  const phaseTotal = recipe?.phases.length ?? 0;
  const resolvedStepId = orderView
    ? resolveOrderStepId(orderView)
    : (currentStepId ?? fallbackStepId);
  const canAdvanceStep =
    phaseTotal > 0 &&
    currentPhaseIndex < phaseTotal &&
    (displayStatus === 'in_progress' || displayStatus === 'paused') &&
    Boolean(resolvedStepId);

  const currentPhaseName =
    recipe?.phases.find((phase) => phase.index === currentPhaseIndex)?.name ??
    recipe?.phases[currentPhaseIndex - 1]?.name;

  const syncFromOrderView = useCallback(async () => {
    if (!orderId) return;

    const view = await fetchFreshOrderRecipeView(queryClient, orderId);
    updateCellSnapshot(orderId, buildSnapshotPatchFromOrderView(view));

    const cell = useDashboardLayoutStore.getState().cells.find((item) => item.orderId === orderId);
    if (cell?.status !== 'incident') {
      updateCellStatus(orderId, mapOrderViewToCellStatus(view));
    }

    if (view.status === 'completed') {
      pauseTimer(cellIndex);
      return;
    }

    ensureTimer(cellIndex, (view.elapsedSeconds ?? 0) * 1000);
    if (view.status === 'in_progress') {
      startTimer(cellIndex);
    } else {
      pauseTimer(cellIndex);
    }
  }, [
    cellIndex,
    ensureTimer,
    orderId,
    pauseTimer,
    queryClient,
    startTimer,
    updateCellSnapshot,
    updateCellStatus,
  ]);

  useEffect(() => {
    didInitialSyncRef.current = false;
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !isRecipeReady || didInitialSyncRef.current) return;
    didInitialSyncRef.current = true;
    void syncFromOrderView();
  }, [isRecipeReady, orderId, syncFromOrderView]);

  useEffect(() => {
    if (!orderId || !recipe) return;

    updateCellSnapshot(orderId, {
      ...(productName ? { productName } : {}),
      recipeName: recipe.recipeName,
      ...(currentPhaseName ? { phaseName: currentPhaseName } : {}),
      phaseIndex: currentPhaseIndex,
      phaseTotal: recipe.phases.length,
      workStationId: apiStationId ?? fallbackWorkStationId,
      currentStepId: orderView ? resolveOrderStepId(orderView) : (currentStepId ?? fallbackStepId),
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
    fallbackStepId,
    fallbackWorkStationId,
    orderView,
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

    const cell = useDashboardLayoutStore.getState().cells.find((item) => item.orderId === orderId);
    if (cell?.status === 'incident') return;

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

    startTimer(cellIndex);
    updateCellStatus(orderId, 'in_progress');
    try {
      await startMutation.mutateAsync({
        workStationId: resolvedWorkStationId,
        idempotencyKey: createIdempotencyKey('start', orderId),
      });
      await syncFromOrderView();
    } catch {
      pauseTimer(cellIndex);
      updateCellStatus(orderId, 'pending');
    }
  }, [
    cellIndex,
    orderId,
    resolvedWorkStationId,
    startMutation,
    startTimer,
    pauseTimer,
    syncFromOrderView,
    updateCellStatus,
  ]);

  const handlePause = useCallback(async () => {
    if (!orderId) return;

    const previousStatus = displayStatus;
    pauseTimer(cellIndex);
    updateCellStatus(orderId, 'paused');
    try {
      await pauseMutation.mutateAsync({
        idempotencyKey: createIdempotencyKey('pause', orderId),
      });
      await syncFromOrderView();
    } catch (error) {
      if (isPlantApiConflictWithMessage(error, 'PAUSED')) {
        await syncFromOrderView();
        return;
      }
      updateCellStatus(orderId, previousStatus);
      if (previousStatus === 'in_progress') {
        resumeTimer(cellIndex);
      }
    }
  }, [
    cellIndex,
    displayStatus,
    orderId,
    pauseMutation,
    pauseTimer,
    resumeTimer,
    syncFromOrderView,
    updateCellStatus,
  ]);

  const handleResume = useCallback(async () => {
    if (!orderId) return;

    const previousStatus = displayStatus;
    resumeTimer(cellIndex);
    updateCellStatus(orderId, 'in_progress');
    try {
      await resumeMutation.mutateAsync({
        idempotencyKey: createIdempotencyKey('resume', orderId),
      });
      await syncFromOrderView();
    } catch (error) {
      if (isPlantApiConflictWithMessage(error, 'IN_PROCESS')) {
        await syncFromOrderView();
        return;
      }
      updateCellStatus(orderId, previousStatus);
      if (previousStatus === 'paused') {
        pauseTimer(cellIndex);
      }
    }
  }, [
    cellIndex,
    displayStatus,
    orderId,
    resumeMutation,
    resumeTimer,
    pauseTimer,
    syncFromOrderView,
    updateCellStatus,
  ]);

  const handleFinish = useCallback(async () => {
    if (!orderId) return;

    const previousStatus = displayStatus;
    pauseTimer(cellIndex);
    updateCellStatus(orderId, 'completed');
    try {
      await finishMutation.mutateAsync({
        idempotencyKey: createIdempotencyKey('finish', orderId),
      });
      await syncFromOrderView();
    } catch {
      updateCellStatus(orderId, previousStatus);
      if (previousStatus === 'in_progress') {
        resumeTimer(cellIndex);
      }
    }
  }, [
    cellIndex,
    displayStatus,
    finishMutation,
    orderId,
    pauseTimer,
    resumeTimer,
    syncFromOrderView,
    updateCellStatus,
  ]);

  const handleNextStep = useCallback(async () => {
    if (!orderId) return;

    const freshView = await fetchFreshOrderRecipeView(queryClient, orderId);
    const stepId = resolveOrderStepId(freshView);
    if (!stepId) return;

    try {
      await completeStepMutation.mutateAsync({
        stepId,
        actualMinutes: Math.max(1, Math.round(elapsedMs / 60_000)),
        idempotencyKey: createIdempotencyKey('complete-step', orderId),
      });
    } catch (error) {
      const alreadyCompleted = isPlantApiConflictWithMessage(error, 'COMPLETED');
      if (alreadyCompleted) {
        await syncFromOrderView();
        return;
      }

      const staleStepId = isPlantApiNotFoundWithMessage(error, 'not found on this order');
      if (staleStepId) {
        await syncFromOrderView();
        const retryView = await fetchFreshOrderRecipeView(queryClient, orderId);
        const retryStepId = resolveOrderStepId(retryView);
        if (retryStepId && retryStepId !== stepId) {
          await completeStepMutation.mutateAsync({
            stepId: retryStepId,
            actualMinutes: Math.max(1, Math.round(elapsedMs / 60_000)),
            idempotencyKey: createIdempotencyKey('complete-step', orderId),
          });
        }
      } else {
        throw error;
      }
    }

    await syncFromOrderView();
  }, [completeStepMutation, elapsedMs, orderId, queryClient, syncFromOrderView]);

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
    canAdvanceStep,
    isRecipeLoading,
    currentPhaseIndex,
    phaseTotal,
  };
}
