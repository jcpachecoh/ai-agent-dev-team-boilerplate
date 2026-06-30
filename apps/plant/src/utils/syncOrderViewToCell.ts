import type { PlantWorkstationSnapshot } from '@restopsiq/ui';

import type { OrderRecipeViewResponse } from '@/api/operator-order.api';
import { mapOrderStatusToWorkstationStatus } from '@/utils/mapOrderRecipeView';

export function buildSnapshotPatchFromOrderView(
  view: OrderRecipeViewResponse,
): Partial<PlantWorkstationSnapshot> {
  const currentPhase =
    view.phases.find((phase) => phase.index === view.currentPhaseIndex) ??
    view.phases[view.currentPhaseIndex - 1];

  return {
    productName: view.productName,
    recipeName: view.recipeName,
    phaseName: currentPhase?.name ?? 'Fase actual',
    phaseIndex: view.currentPhaseIndex,
    phaseTotal: view.phases.length,
    workStationId: view.stationId,
    currentStepId: resolveOrderStepId(view),
    standardDurationMs: (currentPhase?.durationMinutes ?? 0) * 60_000,
  };
}

export function mapOrderViewToCellStatus(
  view: OrderRecipeViewResponse,
): 'pending' | 'in_progress' | 'paused' | 'completed' {
  return mapOrderStatusToWorkstationStatus(view.status);
}

/** Resolves the phase execution id used by complete-step. Never use phase.id — it may be a recipe phase id. */
export function resolveOrderStepId(view: OrderRecipeViewResponse): string | undefined {
  if (view.currentStepId) return view.currentStepId;

  const currentByStatus = view.phases.find((phase) => phase.status === 'current');
  if (currentByStatus?.executionId) return currentByStatus.executionId;

  const currentByIndex = view.phases.find((phase) => phase.index === view.currentPhaseIndex);
  return currentByIndex?.executionId;
}
