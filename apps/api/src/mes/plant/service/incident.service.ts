import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AlarmSeverity } from '@prisma/client';
import type { ProductionIncident } from '@prisma/client';
import { ProductionLogEvent } from '@prisma/client';
import type {
  CreateIncidentInput,
  IIncidentService,
  IncidentResponse,
  ListIncidentsFilters,
  ResolveIncidentInput,
} from '../interfaces/plant.interfaces';
import { IncidentRepository } from '../repository/incident.repository';
import { PlantRepository } from '../repository/plant.repository';
import { ProductionLogRepository } from '../repository/production-log.repository';
import { PlantEventsService } from './plant-events.service';
import { PlantService } from './plant.service';

@Injectable()
export class IncidentService implements IIncidentService {
  private readonly logger = new Logger(IncidentService.name);

  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly plantRepository: PlantRepository,
    private readonly productionLogRepository: ProductionLogRepository,
    private readonly plantEventsService: PlantEventsService,
    private readonly plantService: PlantService,
  ) {}

  async createIncident(
    tenantId: string,
    operatorUserId: string,
    input: CreateIncidentInput,
  ): Promise<IncidentResponse> {
    await this.validateIncidentReferences(tenantId, input);

    const incident = await this.incidentRepository.createIncident(tenantId, operatorUserId, input);
    const response = toIncidentResponse(incident);

    if (input.orderId) {
      await this.productionLogRepository.append({
        tenantId,
        orderId: input.orderId,
        phaseExecutionId: input.executionId ?? null,
        employeeId: operatorUserId,
        workStationId: input.workStationId,
        event: ProductionLogEvent.NOVELTY_ADDED,
        notes: input.description,
      });
    }

    this.plantEventsService.emitIncidentCreated(tenantId, response);

    if (
      (input.severity === AlarmSeverity.CRITICAL || input.requiresPause === true) &&
      input.orderId
    ) {
      await this.tryAutoPauseOrder(tenantId, input.orderId, incident);
    }

    return response;
  }

  async listIncidents(
    tenantId: string,
    filters: ListIncidentsFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<IncidentResponse[]> {
    const incidents = await this.incidentRepository.findIncidents(tenantId, filters, pagination);

    return incidents.map(toIncidentResponse);
  }

  async resolveIncident(
    tenantId: string,
    incidentId: string,
    resolvedBy: string,
    input: ResolveIncidentInput,
  ): Promise<IncidentResponse> {
    const incident = await this.incidentRepository.findIncidentById(tenantId, incidentId);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    if (incident.resolvedAt) {
      throw new ConflictException('Incident is already resolved');
    }

    const resolved = await this.incidentRepository.resolveIncident(
      tenantId,
      incidentId,
      resolvedBy,
      input,
    );

    return toIncidentResponse(resolved);
  }

  private async validateIncidentReferences(
    tenantId: string,
    input: CreateIncidentInput,
  ): Promise<void> {
    const workStation = await this.plantRepository.findWorkStationById(
      tenantId,
      input.workStationId,
    );
    if (!workStation) {
      throw new BadRequestException('workStationId does not belong to tenant');
    }

    if (input.executionId) {
      const execution = await this.plantRepository.findExecutionById(tenantId, input.executionId);
      if (!execution) {
        throw new BadRequestException('executionId does not belong to tenant');
      }
    }

    if (input.orderId) {
      const order = await this.plantRepository.findOrderDetailById(tenantId, input.orderId);
      if (!order) {
        throw new BadRequestException('orderId does not belong to tenant');
      }
    }

    if (input.locationId) {
      const location = await this.incidentRepository.findLocationById(tenantId, input.locationId);
      if (!location) {
        throw new BadRequestException('locationId does not belong to tenant');
      }
    }
  }

  private async tryAutoPauseOrder(
    tenantId: string,
    orderId: string,
    incident: ProductionIncident,
  ): Promise<void> {
    try {
      await this.plantService.pauseOrder(tenantId, orderId, {
        reason: `Incidente crítico: ${incident.type} — ${incident.description.slice(0, 80)}`,
      });
    } catch (err) {
      this.logger.warn(
        `Auto-pause skipped for order ${orderId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

function toIncidentResponse(incident: ProductionIncident): IncidentResponse {
  return {
    id: incident.id,
    tenantId: incident.tenantId,
    orderId: incident.orderId,
    executionId: incident.executionId,
    workStationId: incident.workStationId,
    locationId: incident.locationId,
    operatorUserId: incident.operatorUserId,
    type: incident.type,
    noveltyType: incident.noveltyType,
    severity: incident.severity,
    description: incident.description,
    requiresPause: incident.requiresPause,
    photoUrl: incident.photoUrl,
    resolvedAt: incident.resolvedAt,
    resolvedBy: incident.resolvedBy,
    resolution: incident.resolution,
    createdAt: incident.createdAt,
  };
}
