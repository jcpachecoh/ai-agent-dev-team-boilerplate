import {
  PlantWorkstationCard,
  PlantWorkstationEmptySlot,
  type PlantLayoutMode,
  type PlantWorkstationDensity,
} from '@restopsiq/ui';
import { useMemo, type JSX } from 'react';

import type { PlantUiTheme } from '@/constants/theme';

import { useOrderLiveStatus } from '@/hooks/useOrderLiveStatus';
import { useWorkstationOrderRuntime } from '@/hooks/useWorkstationOrderRuntime';
import type { WorkstationCell } from '@/stores/dashboard-layout.store';

import { useOrderNovelties } from '../hooks/useOrderNovelties';

export interface WorkstationCellProps {
  cell: WorkstationCell;
  layoutMode: PlantLayoutMode;
  theme?: PlantUiTheme;
  noveltiesRefreshKey?: number;
  onAssign: (cellIndex: number) => void;
  onChangeOrder: (cellIndex: number) => void;
  onViewRecipe: (cellIndex: number) => void;
  onReportIssue?: (cellIndex: number) => void;
}

function resolveDensity(layoutMode: PlantLayoutMode): PlantWorkstationDensity {
  return layoutMode === '1x1' ? 'full' : 'compact';
}

export function WorkstationCellView({
  cell,
  layoutMode,
  theme = 'dark',
  noveltiesRefreshKey = 0,
  onAssign,
  onChangeOrder,
  onViewRecipe,
  onReportIssue,
}: WorkstationCellProps): JSX.Element {
  const density = resolveDensity(layoutMode);
  const { data: liveStatus } = useOrderLiveStatus(cell.orderId);
  const {
    items: novelties,
    loading: noveltiesLoading,
    openCount,
  } = useOrderNovelties(cell.orderId, noveltiesRefreshKey);

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
    isRecipeLoading,
    currentPhaseIndex,
    phaseTotal,
  } = useWorkstationOrderRuntime({
    cellIndex: cell.cellIndex,
    orderId: cell.orderId,
    fallbackWorkStationId: cell.snapshot?.workStationId,
    fallbackStepId: cell.snapshot?.currentStepId,
    fallbackStatus,
  });

  const cardStatus = useMemo(() => {
    if (displayStatus === 'completed') return 'completed' as const;
    if (openCount > 0) return 'incident' as const;
    return displayStatus;
  }, [displayStatus, openCount]);

  if (cell.status === 'empty' || !cell.snapshot) {
    return (
      <PlantWorkstationEmptySlot
        density={density}
        theme={theme}
        onAssign={() => onAssign(cell.cellIndex)}
      />
    );
  }

  const liveSnapshot = {
    ...cell.snapshot,
    phaseIndex: currentPhaseIndex,
    phaseTotal: phaseTotal || cell.snapshot.phaseTotal,
  };

  return (
    <PlantWorkstationCard
      theme={theme}
      status={cardStatus}
      actionStatus={displayStatus}
      snapshot={liveSnapshot}
      density={density}
      elapsedMs={elapsedMs}
      timerRunning={timerRunning}
      novelties={novelties}
      noveltiesLoading={noveltiesLoading}
      actionsPending={isPending}
      startLoading={isRecipeLoading && fallbackStatus === 'pending'}
      onStart={!canStart ? undefined : () => void handleStart()}
      onPause={() => void handlePause()}
      onResume={() => void handleResume()}
      onNextStep={!canAdvanceStep ? undefined : () => void handleNextStep()}
      onFinish={() => void handleFinish()}
      onChangeOrder={() => onChangeOrder(cell.cellIndex)}
      onViewRecipe={() => onViewRecipe(cell.cellIndex)}
      onReportIssue={onReportIssue ? () => onReportIssue(cell.cellIndex) : undefined}
    />
  );
}

export default WorkstationCellView;
