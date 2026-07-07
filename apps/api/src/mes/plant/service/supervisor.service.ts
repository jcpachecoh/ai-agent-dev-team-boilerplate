import { Injectable, NotFoundException } from '@nestjs/common';
import { PhaseExecutionStatus, type WorkStation } from '@prisma/client';
import type {
  SupervisorAssignedRecipe,
  SupervisorOverviewAlarm,
  SupervisorOverviewKpi,
  SupervisorOverviewNewsItem,
  SupervisorOverviewResponse,
  SupervisorOverviewStationCard,
  SupervisorStationLiveDetailResponse,
  SupervisorStationLiveOperator,
  SupervisorStationLivePhase,
  SupervisorStationMasterRow,
  SupervisorStationsResponse,
} from '../interfaces/supervisor.interfaces';
import {
  mapAlarmSeverityToUi,
  mapEfficiencyStatus,
  mapPriorityToUi,
} from '../interfaces/supervisor.interfaces';
import {
  SupervisorRepository,
  type SupervisorActiveExecution,
  type SupervisorPhaseWithRecipe,
} from '../repository/supervisor.repository';

const OPERATOR_TONES = ['gold', 'teal', 'info', 'warning', 'danger'] as const;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatElapsedTimer(startedAt: Date | null): string {
  if (!startedAt) return '00:00';
  const elapsedMs = Math.max(0, Date.now() - startedAt.getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function initialsFromEmail(email: string | undefined, fallbackId: string): string {
  if (email) {
    const local = email.split('@')[0] ?? '';
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }
  return fallbackId.slice(0, 2).toUpperCase();
}

function displayNameFromEmail(email: string | undefined, fallbackId: string): string {
  if (email) {
    const local = email.split('@')[0] ?? '';
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return parts
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return fallbackId.slice(0, 8);
}

function formatStandardMinutes(minutes: number): string {
  return `${String(minutes).padStart(2, '0')}:00`;
}

function mapExecutionPhaseStatus(
  executionStatus: PhaseExecutionStatus,
): SupervisorStationLivePhase['status'] {
  switch (executionStatus) {
    case PhaseExecutionStatus.COMPLETED:
    case PhaseExecutionStatus.QA_PENDING:
      return 'completed';
    case PhaseExecutionStatus.IN_PROCESS:
    case PhaseExecutionStatus.PAUSED:
      return 'in_progress';
    default:
      return 'pending';
  }
}

function inferTypeLabel(name: string, description?: string | null): string {
  const text = `${name} ${description ?? ''}`.toLowerCase();
  if (text.includes('empaque') || text.includes('despacho')) return 'Empaque';
  if (text.includes('frí') || text.includes('fri') || text.includes('refrig'))
    return 'Enfriamiento';
  if (text.includes('parrilla') || text.includes('cocc') || text.includes('frit')) return 'Cocción';
  if (text.includes('madur')) return 'Maduración';
  if (text.includes('sanit') || text.includes('lavado')) return 'Sanitización';
  if (text.includes('corte') || text.includes('filet') || text.includes('proces'))
    return 'Procesamiento';
  if (text.includes('mise') || text.includes('prepar')) return 'Preparación';
  return 'Operación';
}

function inferTypeTone(type: string): SupervisorStationMasterRow['typeTone'] {
  switch (type) {
    case 'Preparación':
      return 'preparation';
    case 'Procesamiento':
      return 'processing';
    case 'Cocción':
      return 'cooking';
    case 'Enfriamiento':
      return 'cooling';
    case 'Empaque':
      return 'packing';
    case 'Maduración':
      return 'maturation';
    case 'Sanitización':
      return 'sanitation';
    default:
      return 'neutral';
  }
}

function incidentTitle(type: string, description: string): string {
  const normalized = type.replace(/_/g, ' ').toLowerCase();
  if (description.trim()) return description.trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function incidentNewsTitle(type: string): string {
  switch (type) {
    case 'QUALITY':
      return 'Incidencia de calidad';
    case 'SAFETY':
      return 'Incidencia de seguridad';
    case 'EQUIPMENT':
      return 'Falla de equipo';
    default:
      return 'Novedad operativa';
  }
}

@Injectable()
export class SupervisorService {
  constructor(private readonly supervisorRepository: SupervisorRepository) {}

  async getOverview(tenantId: string): Promise<SupervisorOverviewResponse> {
    const startOfDay = startOfToday();
    const [
      workStations,
      openIncidentsForAlarms,
      allOpenIncidents,
      recentIncidents,
      activeExecutions,
      completedToday,
      openIncidentCount,
    ] = await Promise.all([
      this.supervisorRepository.findWorkStations(tenantId),
      this.supervisorRepository.findOpenIncidents(tenantId, 10),
      this.supervisorRepository.findAllOpenIncidents(tenantId),
      this.supervisorRepository.findRecentIncidents(tenantId, 10),
      this.supervisorRepository.findActiveExecutions(tenantId),
      this.supervisorRepository.countCompletedOrdersToday(tenantId, startOfDay),
      this.supervisorRepository.countOpenIncidents(tenantId),
    ]);

    const stationById = new Map(workStations.map((station) => [station.id, station]));
    const executionByStation = new Map<string, SupervisorActiveExecution>();
    for (const execution of activeExecutions) {
      const current = executionByStation.get(execution.workStationId);
      if (
        !current ||
        (execution.startedAt && (!current.startedAt || execution.startedAt > current.startedAt))
      ) {
        executionByStation.set(execution.workStationId, execution);
      }
    }

    const incidentsByStation = new Map<string, (typeof allOpenIncidents)[number][]>();
    for (const incident of allOpenIncidents) {
      const list = incidentsByStation.get(incident.workStationId) ?? [];
      list.push(incident);
      incidentsByStation.set(incident.workStationId, list);
    }

    const recipePhaseCounts = new Map<string, number>();
    const uniqueRecipeIds = [
      ...new Set(activeExecutions.map((execution) => execution.order.recipeId)),
    ];
    await Promise.all(
      uniqueRecipeIds.map(async (recipeId) => {
        const count = await this.supervisorRepository.findPhaseCountsByRecipe(recipeId, tenantId);
        recipePhaseCounts.set(recipeId, count);
      }),
    );

    const activeStationIds = new Set(
      workStations
        .filter((station) => station.isActive && executionByStation.has(station.id))
        .map((station) => station.id),
    );
    const totalActiveStations = workStations.filter((station) => station.isActive).length;

    const stations: SupervisorOverviewStationCard[] = workStations
      .filter((station) => station.isActive)
      .map((station) =>
        this.buildStationCard(
          station,
          executionByStation.get(station.id),
          incidentsByStation.get(station.id)?.[0],
          recipePhaseCounts.get(executionByStation.get(station.id)?.order.recipeId ?? '') ?? 0,
        ),
      );

    const alarms: SupervisorOverviewAlarm[] = openIncidentsForAlarms.map((incident, index) => {
      const station = stationById.get(incident.workStationId);
      return {
        id: incident.id,
        code: `ALM-${String(index + 1).padStart(3, '0')}`,
        severity: mapAlarmSeverityToUi(incident.severity),
        title: incidentTitle(incident.type, incident.description),
        stationLabel: station ? `${station.code} · ${station.name}` : incident.workStationId,
        timeLabel: formatRelativeTime(incident.createdAt),
      };
    });

    const news: SupervisorOverviewNewsItem[] = recentIncidents.map((incident) => ({
      id: incident.id,
      title: incidentNewsTitle(incident.type),
      detail: `${incident.reporter.user?.email?.split('@')[0] ?? 'Operario'} · ${incident.workStation.code}`,
      timeLabel: formatClockTime(incident.createdAt),
      statusLabel: incident.resolvedAt ? 'RESUELTO' : 'PENDIENTE',
      statusTone: incident.resolvedAt ? 'success' : 'warning',
    }));

    const avgEfficiency =
      activeExecutions.length > 0
        ? activeExecutions.reduce((sum, execution) => {
            const pct =
              execution.efficiencyPct?.toNumber() ??
              (execution.actualMinutes && execution.plannedMinutes
                ? (execution.actualMinutes / execution.plannedMinutes) * 100
                : 0);
            return sum + pct;
          }, 0) / activeExecutions.length
        : 0;

    const kpis: SupervisorOverviewKpi[] = [
      {
        label: 'Throughput',
        value: String(completedToday),
        unit: 'OP',
        delta: completedToday > 0 ? `▲ ${completedToday} hoy` : undefined,
        accent: 'teal',
      },
      {
        label: 'OEE Línea',
        value: avgEfficiency > 0 ? avgEfficiency.toFixed(1) : '—',
        unit: avgEfficiency > 0 ? '%' : undefined,
        accent: avgEfficiency > 100 ? 'danger' : 'teal',
      },
      {
        label: 'Alarmas activas',
        value: String(openIncidentCount),
        accent: openIncidentCount > 0 ? 'danger' : 'muted',
      },
      {
        label: 'Estaciones activas',
        value: `${activeStationIds.size}/${totalActiveStations}`,
        accent: 'gold',
      },
      {
        label: 'Completadas hoy',
        value: String(completedToday),
        unit: 'OP',
        accent: 'teal',
      },
      {
        label: 'Ejecuciones',
        value: String(activeExecutions.length),
        unit: 'activas',
        accent: activeExecutions.length > 0 ? 'warning' : 'muted',
      },
    ];

    return {
      kpis,
      stations,
      alarms,
      news,
      activeStationCount: activeStationIds.size,
    };
  }

  async getStationLiveDetail(
    tenantId: string,
    stationId: string,
  ): Promise<SupervisorStationLiveDetailResponse> {
    const station = await this.supervisorRepository.findWorkStationById(tenantId, stationId);
    if (!station) {
      throw new NotFoundException(`Work station not found: ${stationId}`);
    }

    const execution = await this.supervisorRepository.findActiveExecutionForStation(
      tenantId,
      stationId,
    );

    if (!execution) {
      return {
        stationId: station.id,
        code: station.code,
        name: station.name,
        timerLabel: '00:00',
        productName: station.description ?? undefined,
      };
    }

    const [recipePhases, orderExecutions] = await Promise.all([
      this.supervisorRepository.findRecipePhases(tenantId, execution.order.recipeId),
      this.supervisorRepository.findOrderExecutions(tenantId, execution.order.id),
    ]);

    const executionStatusByPhaseOrder = new Map(
      orderExecutions.map((item) => [item.phase.order, item.status]),
    );

    const phases: SupervisorStationLivePhase[] = recipePhases.map((phase) => ({
      order: phase.order,
      name: phase.name,
      status: mapExecutionPhaseStatus(
        executionStatusByPhaseOrder.get(phase.order) ?? PhaseExecutionStatus.PENDING,
      ),
    }));

    const progressPct =
      execution.efficiencyPct?.toNumber() ??
      (execution.actualMinutes && execution.plannedMinutes
        ? Math.round((execution.actualMinutes / execution.plannedMinutes) * 100)
        : execution.startedAt
          ? Math.min(
              100,
              Math.round(
                ((Date.now() - execution.startedAt.getTime()) / 60_000 / execution.plannedMinutes) *
                  100,
              ),
            )
          : 0);

    const standardMinutes = execution.phase.standardMinutes;
    const exceeded = progressPct > 100;

    const operators: SupervisorStationLiveOperator[] = execution.sessions.map((session, index) => ({
      initials: initialsFromEmail(session.operator.user?.email, session.operatorUserId),
      name: displayNameFromEmail(session.operator.user?.email, session.operatorUserId),
      roleLabel: 'Operador',
      timerLabel: formatElapsedTimer(session.startedAt),
      tone: OPERATOR_TONES[index % OPERATOR_TONES.length],
    }));

    const orderNumber = execution.order.number.startsWith('OP-')
      ? execution.order.number
      : `OP-${execution.order.number}`;

    return {
      stationId: station.id,
      code: station.code,
      name: station.name,
      productName: execution.order.recipe.name,
      timerLabel: formatElapsedTimer(execution.startedAt),
      standardTimeLabel: `Estándar: ${formatStandardMinutes(standardMinutes)} · ${Math.round(progressPct)}%`,
      progress: Math.round(progressPct),
      efficiencyStatus: mapEfficiencyStatus(progressPct),
      exceeded,
      phases,
      orderNumber,
      orderId: execution.order.id,
      goalLabel: `${execution.order.plannedQuantity.toString()} ${execution.order.unit.toLowerCase()}`,
      operators,
    };
  }

  async getStations(tenantId: string): Promise<SupervisorStationsResponse> {
    const [workStations, phases, activeExecutions] = await Promise.all([
      this.supervisorRepository.findWorkStations(tenantId),
      this.supervisorRepository.findPhasesByTenant(tenantId),
      this.supervisorRepository.findActiveExecutions(tenantId),
    ]);

    const phasesByStation = new Map<string, SupervisorPhaseWithRecipe[]>();
    for (const phase of phases) {
      const list = phasesByStation.get(phase.workStationId) ?? [];
      list.push(phase);
      phasesByStation.set(phase.workStationId, list);
    }

    const busyStationIds = new Set(activeExecutions.map((execution) => execution.workStationId));

    const stations: SupervisorStationMasterRow[] = workStations.map((station) => {
      const stationPhases = phasesByStation.get(station.id) ?? [];
      const recipeIds = new Set(stationPhases.map((phase) => phase.recipeId));
      const assignedRecipes: SupervisorAssignedRecipe[] = stationPhases
        .filter((phase) => phase.recipe.isActive)
        .map((phase) => ({
          recipeId: phase.recipe.id,
          recipeName: phase.recipe.name,
          phaseName: phase.name,
        }));

      const maxOperators = stationPhases.reduce(
        (max, phase) => Math.max(max, phase.maxOperators),
        0,
      );
      const type = inferTypeLabel(station.name, station.description);
      const recipeCount = recipeIds.size;

      let status: SupervisorStationMasterRow['status'] = 'inactive';
      if (station.isActive) {
        status = busyStationIds.has(station.id) ? 'active' : 'active';
      }

      return {
        id: station.id,
        code: station.code,
        name: station.name,
        location: station.location ?? '—',
        description: station.description,
        type,
        typeTone: inferTypeTone(type),
        capacityLabel: maxOperators > 0 ? `${maxOperators} op.` : '—',
        status,
        recipeCountLabel:
          recipeCount > 0 ? `${recipeCount} receta${recipeCount === 1 ? '' : 's'}` : '—',
        phaseCount: stationPhases.length,
        assignedRecipes,
      };
    });

    return { stations };
  }

  private buildStationCard(
    station: WorkStation,
    execution: SupervisorActiveExecution | undefined,
    topIncident: { severity: Parameters<typeof mapAlarmSeverityToUi>[0] } | undefined,
    totalPhases: number,
  ): SupervisorOverviewStationCard {
    if (!execution) {
      return {
        id: station.id,
        code: station.code,
        name: station.name,
        subtitle: station.description ?? undefined,
        status: station.isActive ? 'inactive' : 'inactive',
        operators: [],
        operatorCountLabel: '0 op.',
        severity: topIncident ? mapAlarmSeverityToUi(topIncident.severity) : undefined,
      };
    }

    const progressPct =
      execution.efficiencyPct?.toNumber() ??
      (execution.actualMinutes && execution.plannedMinutes
        ? Math.round((execution.actualMinutes / execution.plannedMinutes) * 100)
        : execution.startedAt
          ? Math.min(
              100,
              Math.round(
                ((Date.now() - execution.startedAt.getTime()) / 60_000 / execution.plannedMinutes) *
                  100,
              ),
            )
          : 0);

    const operators = execution.sessions.map((session, index) => ({
      initials: initialsFromEmail(session.operator.user?.email, session.operatorUserId),
      tone: OPERATOR_TONES[index % OPERATOR_TONES.length],
    }));

    return {
      id: station.id,
      code: station.code,
      name: station.name,
      subtitle: execution.phase.name,
      orderNumber: execution.order.number.startsWith('OP-')
        ? execution.order.number
        : `OP-${execution.order.number}`,
      productName: execution.order.recipe.name,
      priority: mapPriorityToUi(execution.order.priority as 'NORMAL' | 'HIGH' | 'URGENT'),
      quantityLabel: `${execution.order.plannedQuantity.toString()} ${execution.order.unit.toLowerCase()}`,
      phaseLabel:
        totalPhases > 0
          ? `Fase ${execution.phase.order}/${totalPhases}`
          : `Fase ${execution.phase.order}`,
      progress: Math.round(progressPct),
      efficiencyStatus: mapEfficiencyStatus(progressPct),
      timerLabel: formatElapsedTimer(execution.startedAt),
      severity: topIncident ? mapAlarmSeverityToUi(topIncident.severity) : undefined,
      operators,
      operatorCountLabel: operators.length > 0 ? `${operators.length} op.` : '0 op.',
      status: 'active',
    };
  }
}
