import {
  PlantWorkstationCard,
  PlantWorkstationEmptySlot,
  type PlantLayoutMode,
  type PlantWorkstationDensity,
} from '@restopsiq/ui';
import { useCallback, useEffect, type JSX } from 'react';

import type { WorkstationCell } from '@/stores/dashboard-layout.store';
import { useWorkstationTimerStore } from '@/stores/workstation-timer.store';

export interface WorkstationCellProps {
  cell: WorkstationCell;
  layoutMode: PlantLayoutMode;
  onAssign: (cellIndex: number) => void;
  onChangeOrder: (cellIndex: number) => void;
  onViewRecipe: (cellIndex: number) => void;
  onReportIssue?: () => void;
  onFinish?: () => void;
}

function resolveDensity(layoutMode: PlantLayoutMode): PlantWorkstationDensity {
  return layoutMode === '1x1' ? 'full' : 'compact';
}

export function WorkstationCellView({
  cell,
  layoutMode,
  onAssign,
  onChangeOrder,
  onViewRecipe,
  onReportIssue,
  onFinish,
}: WorkstationCellProps): JSX.Element {
  const density = resolveDensity(layoutMode);
  const ensureTimer = useWorkstationTimerStore((s) => s.ensureTimer);
  const startTimer = useWorkstationTimerStore((s) => s.startTimer);
  const pauseTimer = useWorkstationTimerStore((s) => s.pauseTimer);
  const resumeTimer = useWorkstationTimerStore((s) => s.resumeTimer);
  const elapsedMs = useWorkstationTimerStore((s) => s.timers[cell.cellIndex]?.elapsedMs ?? 0);
  const timerRunning =
    useWorkstationTimerStore((s) => s.timers[cell.cellIndex]?.status === 'running') ?? false;

  useEffect(() => {
    if (cell.status === 'empty' || !cell.snapshot) return;
    const initialMs =
      cell.status === 'in_progress' ? 14 * 60 * 1000 + 37 * 1000 : 8 * 60 * 1000 + 26 * 1000;
    ensureTimer(cell.cellIndex, initialMs);
    if (cell.status === 'in_progress') {
      startTimer(cell.cellIndex);
    }
  }, [cell.cellIndex, cell.snapshot?.orderId, cell.status, ensureTimer, startTimer]);

  const handleStart = useCallback(() => {
    startTimer(cell.cellIndex);
  }, [cell.cellIndex, startTimer]);

  const handlePause = useCallback(() => {
    pauseTimer(cell.cellIndex);
  }, [cell.cellIndex, pauseTimer]);

  const handleResume = useCallback(() => {
    resumeTimer(cell.cellIndex);
  }, [cell.cellIndex, resumeTimer]);

  if (cell.status === 'empty' || !cell.snapshot) {
    return (
      <PlantWorkstationEmptySlot density={density} onAssign={() => onAssign(cell.cellIndex)} />
    );
  }

  return (
    <PlantWorkstationCard
      status={cell.status}
      snapshot={cell.snapshot}
      density={density}
      elapsedMs={elapsedMs}
      timerRunning={timerRunning}
      onStart={handleStart}
      onPause={handlePause}
      onResume={handleResume}
      onChangeOrder={() => onChangeOrder(cell.cellIndex)}
      onViewRecipe={() => onViewRecipe(cell.cellIndex)}
      onFinish={onFinish}
      onReportIssue={onReportIssue}
    />
  );
}

export default WorkstationCellView;
