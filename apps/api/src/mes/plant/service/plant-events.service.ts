import { Injectable } from '@nestjs/common';
import type { AlarmTriggeredPayload } from '../controller/dto/alarm-triggered.payload';
import type { IncidentCreatedPayload } from '../controller/dto/incident.response';
import { PlantGateway } from '../gateway/plant.gateway';
import type { IncidentResponse, PhaseStatusChange } from '../interfaces/plant.interfaces';

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

  emitAlarmTriggered(tenantId: string, payload: AlarmTriggeredPayload): void {
    this.plantGateway.emitAlarmTriggered(tenantId, payload);
  }

  emitIncidentCreated(tenantId: string, incident: IncidentResponse): void {
    const payload: IncidentCreatedPayload = {
      incidentId: incident.id,
      stationId: incident.workStationId,
      orderId: incident.orderId ?? undefined,
      executionId: incident.executionId ?? undefined,
      type: incident.type,
      severity: incident.severity,
    };

    this.plantGateway.emitIncidentCreated(tenantId, payload);
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
