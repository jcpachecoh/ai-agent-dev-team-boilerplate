import {
  PlantWorkstationCard,
  PlantWorkstationEmptySlot,
  type PlantLayoutMode,
  type PlantWorkstationDensity,
} from '@restopsiq/ui';
import { type JSX } from 'react';

import { useOrderLiveStatus } from '@/hooks/useOrderLiveStatus';
import { useWorkstationOrderRuntime } from '@/hooks/useWorkstationOrderRuntime';
import type { WorkstationCell } from '@/stores/dashboard-layout.store';

export interface WorkstationCellProps {
  cell: WorkstationCell;
  layoutMode: PlantLayoutMode;
  onAssign: (cellIndex: number) => void;
  onChangeOrder: (cellIndex: number) => void;
  onViewRecipe: (cellIndex: number) => void;
  onReportIssue?: () => void;
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
}: WorkstationCellProps): JSX.Element {
  const density = resolveDensity(layoutMode);
  const { data: liveStatus } = useOrderLiveStatus(cell.orderId);

  const fallbackStatus: 'pending' | 'in_progress' | 'paused' | 'incident' | 'completed' =
    liveStatus ?? (cell.status === 'empty' ? 'pending' : cell.status);

  const {
    displayStatus,
    elapsedMs,
    timerRunning,
    handleStart,
    handlePause,
    handleResume,
    handleNextStep,
    handleFinish,
    isPending,
    canStart,
    canAdvanceStep,
  } = useWorkstationOrderRuntime({
    cellIndex: cell.cellIndex,
    orderId: cell.orderId,
    fallbackWorkStationId: cell.snapshot?.workStationId,
    fallbackStepId: cell.snapshot?.currentStepId,
    fallbackStatus,
  });

  if (cell.status === 'empty' || !cell.snapshot) {
    return (
      <PlantWorkstationEmptySlot density={density} onAssign={() => onAssign(cell.cellIndex)} />
    );
  }

  return (
    <PlantWorkstationCard
      status={displayStatus}
      snapshot={cell.snapshot}
      density={density}
      elapsedMs={elapsedMs}
      timerRunning={timerRunning}
      onStart={isPending || !canStart ? undefined : () => void handleStart()}
      onPause={isPending ? undefined : () => void handlePause()}
      onResume={isPending ? undefined : () => void handleResume()}
      onNextStep={isPending || !canAdvanceStep ? undefined : () => void handleNextStep()}
      onFinish={isPending ? undefined : () => void handleFinish()}
      onChangeOrder={() => onChangeOrder(cell.cellIndex)}
      onViewRecipe={() => onViewRecipe(cell.cellIndex)}
      onReportIssue={onReportIssue}
    />
  );
}

export default WorkstationCellView;
