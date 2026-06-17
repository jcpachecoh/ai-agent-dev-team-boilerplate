import { getPlantRecipeDetail, PlantRecipeDetailScreen } from '@restopsiq/ui';
import { useCallback, type JSX } from 'react';

import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { useWorkstationTimerStore } from '@/stores/workstation-timer.store';

export interface RecipeDetailHostProps {
  cellIndex: number | null;
  operatorName: string;
  onBack: () => void;
  onFinish?: () => void;
  onReportIssue?: () => void;
}

export function RecipeDetailHost({
  cellIndex,
  operatorName,
  onBack,
  onFinish,
  onReportIssue,
}: RecipeDetailHostProps): JSX.Element | null {
  const cell =
    useDashboardLayoutStore((s) =>
      cellIndex === null ? null : s.cells.find((item) => item.cellIndex === cellIndex),
    ) ?? null;
  const updateCellStatus = useDashboardLayoutStore((s) => s.updateCellStatus);

  const elapsedMs = useWorkstationTimerStore((s) =>
    cellIndex === null ? 0 : (s.timers[cellIndex]?.elapsedMs ?? 0),
  );
  const timerRunning =
    useWorkstationTimerStore((s) =>
      cellIndex === null ? false : s.timers[cellIndex]?.status === 'running',
    ) ?? false;
  const startTimer = useWorkstationTimerStore((s) => s.startTimer);
  const pauseTimer = useWorkstationTimerStore((s) => s.pauseTimer);
  const resumeTimer = useWorkstationTimerStore((s) => s.resumeTimer);

  const handleStart = useCallback(() => {
    if (cellIndex === null || !cell?.orderId) return;
    startTimer(cellIndex);
    updateCellStatus(cell.orderId, 'in_progress');
  }, [cell?.orderId, cellIndex, startTimer, updateCellStatus]);

  const handlePause = useCallback(() => {
    if (cellIndex === null || !cell?.orderId) return;
    pauseTimer(cellIndex);
    updateCellStatus(cell.orderId, 'paused');
  }, [cell?.orderId, cellIndex, pauseTimer, updateCellStatus]);

  const handleResume = useCallback(() => {
    if (cellIndex === null || !cell?.orderId) return;
    resumeTimer(cellIndex);
    updateCellStatus(cell.orderId, 'in_progress');
  }, [cell?.orderId, cellIndex, resumeTimer, updateCellStatus]);

  if (cellIndex === null || !cell?.snapshot || cell.status === 'empty') {
    return null;
  }

  const recipe = getPlantRecipeDetail(cell.snapshot.orderId);
  if (!recipe) return null;

  return (
    <PlantRecipeDetailScreen
      orderId={cell.snapshot.orderId}
      productName={cell.snapshot.productName}
      operatorName={cell.snapshot.operatorName ?? operatorName}
      status={cell.status}
      recipe={recipe}
      currentPhaseIndex={cell.snapshot.phaseIndex}
      elapsedMs={elapsedMs}
      timerRunning={timerRunning}
      onBack={onBack}
      onStart={handleStart}
      onPause={handlePause}
      onResume={handleResume}
      onFinishOrder={onFinish}
      onReportIssue={onReportIssue}
    />
  );
}

export default RecipeDetailHost;
