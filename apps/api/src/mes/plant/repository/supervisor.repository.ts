import { Injectable } from '@nestjs/common';
import {
  PhaseExecutionStatus,
  type ProductionIncident,
  type ProductionPhase,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const ACTIVE_EXECUTION_STATUSES: PhaseExecutionStatus[] = [
  PhaseExecutionStatus.IN_PROCESS,
  PhaseExecutionStatus.PAUSED,
];

export type SupervisorPhaseWithRecipe = ProductionPhase & {
  recipe: { id: string; name: string; isActive: boolean };
};

export type SupervisorActiveExecution = {
  id: string;
  workStationId: string;
  status: PhaseExecutionStatus;
  plannedMinutes: number;
  actualMinutes: number | null;
  efficiencyPct: { toNumber(): number } | null;
  startedAt: Date | null;
  order: {
    id: string;
    number: string;
    priority: string;
    plannedQuantity: { toString(): string };
    unit: string;
    recipeId: string;
    recipe: { name: string };
  };
  phase: {
    order: number;
    name: string;
    standardMinutes: number;
    maxOperators: number;
  };
  sessions: Array<{
    id: string;
    operatorUserId: string;
    startedAt: Date;
    operator: {
      id: string;
      user: { email: string } | null;
    };
  }>;
};

@Injectable()
export class SupervisorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWorkStations(tenantId: string) {
    return this.prisma.workStation.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
    });
  }

  findPhasesByTenant(tenantId: string): Promise<SupervisorPhaseWithRecipe[]> {
    return this.prisma.productionPhase.findMany({
      where: { tenantId },
      include: {
        recipe: { select: { id: true, name: true, isActive: true } },
      },
      orderBy: [{ recipeId: 'asc' }, { order: 'asc' }],
    });
  }

  findOpenIncidents(tenantId: string, take = 10): Promise<ProductionIncident[]> {
    return this.prisma.productionIncident.findMany({
      where: { tenantId, resolvedAt: null },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  findAllOpenIncidents(tenantId: string): Promise<ProductionIncident[]> {
    return this.prisma.productionIncident.findMany({
      where: { tenantId, resolvedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findRecentIncidents(tenantId: string, take = 10) {
    return this.prisma.productionIncident.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        workStation: { select: { code: true, name: true } },
        reporter: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });
  }

  findActiveExecutions(tenantId: string): Promise<SupervisorActiveExecution[]> {
    return this.prisma.phaseExecution.findMany({
      where: {
        tenantId,
        status: { in: ACTIVE_EXECUTION_STATUSES },
      },
      include: {
        order: {
          select: {
            id: true,
            number: true,
            priority: true,
            plannedQuantity: true,
            unit: true,
            recipeId: true,
            recipe: { select: { name: true } },
          },
        },
        phase: {
          select: {
            order: true,
            name: true,
            standardMinutes: true,
            maxOperators: true,
          },
        },
        sessions: {
          where: { endedAt: null },
          select: {
            id: true,
            operatorUserId: true,
            startedAt: true,
            operator: {
              select: {
                id: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });
  }

  countCompletedOrdersToday(tenantId: string, startOfDay: Date): Promise<number> {
    return this.prisma.productionOrder.count({
      where: {
        tenantId,
        status: 'COMPLETED',
        actualEndAt: { gte: startOfDay },
      },
    });
  }

  countOpenIncidents(tenantId: string): Promise<number> {
    return this.prisma.productionIncident.count({
      where: { tenantId, resolvedAt: null },
    });
  }

  findPhaseCountsByRecipe(recipeId: string, tenantId: string): Promise<number> {
    return this.prisma.productionPhase.count({
      where: { tenantId, recipeId },
    });
  }

  findWorkStationById(tenantId: string, stationId: string) {
    return this.prisma.workStation.findFirst({
      where: { tenantId, id: stationId },
    });
  }

  findActiveExecutionForStation(
    tenantId: string,
    stationId: string,
  ): Promise<SupervisorActiveExecution | null> {
    return this.prisma.phaseExecution.findFirst({
      where: {
        tenantId,
        workStationId: stationId,
        status: { in: ACTIVE_EXECUTION_STATUSES },
      },
      include: {
        order: {
          select: {
            id: true,
            number: true,
            priority: true,
            plannedQuantity: true,
            unit: true,
            recipeId: true,
            recipe: { select: { name: true } },
          },
        },
        phase: {
          select: {
            order: true,
            name: true,
            standardMinutes: true,
            maxOperators: true,
          },
        },
        sessions: {
          where: { endedAt: null },
          select: {
            id: true,
            operatorUserId: true,
            startedAt: true,
            operator: {
              select: {
                id: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  findRecipePhases(tenantId: string, recipeId: string) {
    return this.prisma.productionPhase.findMany({
      where: { tenantId, recipeId },
      orderBy: { order: 'asc' },
      select: { order: true, name: true, standardMinutes: true },
    });
  }

  findOrderExecutions(tenantId: string, orderId: string) {
    return this.prisma.phaseExecution.findMany({
      where: { tenantId, orderId },
      include: {
        phase: { select: { order: true } },
      },
    });
  }
}
