import { Injectable } from '@nestjs/common';
import { PlantGateway } from '../gateway/plant.gateway';
import type { PhaseStatusChange } from '../interfaces/plant.interfaces';

export interface PhaseStatusChangedPayload {
  orderId: string;
  phaseId: string;
  stationId: string;
  status: string;
}

@Injectable()
export class PlantEventsService {
  constructor(private readonly plantGateway: PlantGateway) {}

  emitPhaseStatusChanges(tenantId: string, changes: PhaseStatusChange[]): void {
    for (const change of changes) {
      this.emitPhaseStatusChanged(tenantId, change);
    }
  }

  emitPhaseStatusChanged(tenantId: string, change: PhaseStatusChange): void {
    this.plantGateway.emitPhaseStatusChanged(tenantId, this.toPayload(change));
  }

  private toPayload(change: PhaseStatusChange): PhaseStatusChangedPayload {
    return {
      orderId: change.orderId,
      phaseId: change.phaseId,
      stationId: change.workStationId,
      status: change.status,
    };
  }
}
