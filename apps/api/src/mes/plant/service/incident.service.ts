import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProductionIncident } from '@prisma/client';
import type {
  CreateIncidentInput,
  IIncidentService,
  IncidentResponse,
  ListIncidentsFilters,
  ResolveIncidentInput,
} from '../interfaces/plant.interfaces';
import { IncidentRepository } from '../repository/incident.repository';
import { PlantRepository } from '../repository/plant.repository';
import { PlantEventsService } from './plant-events.service';

@Injectable()
export class IncidentService implements IIncidentService {
  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly plantRepository: PlantRepository,
    private readonly plantEventsService: PlantEventsService,
  ) {}

  async createIncident(
    tenantId: string,
    operatorUserId: string,
    input: CreateIncidentInput,
  ): Promise<IncidentResponse> {
    await this.validateIncidentReferences(tenantId, input);

    const incident = await this.incidentRepository.createIncident(tenantId, operatorUserId, input);
    const response = toIncidentResponse(incident);

    this.plantEventsService.emitIncidentCreated(tenantId, response);

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
  }
}

function toIncidentResponse(incident: ProductionIncident): IncidentResponse {
  return {
    id: incident.id,
    tenantId: incident.tenantId,
    orderId: incident.orderId,
    executionId: incident.executionId,
    workStationId: incident.workStationId,
    operatorUserId: incident.operatorUserId,
    type: incident.type,
    severity: incident.severity,
    description: incident.description,
    photoUrl: incident.photoUrl,
    resolvedAt: incident.resolvedAt,
    resolvedBy: incident.resolvedBy,
    resolution: incident.resolution,
    createdAt: incident.createdAt,
  };
}
