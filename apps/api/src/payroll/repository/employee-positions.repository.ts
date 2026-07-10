import { Injectable } from '@nestjs/common';
import { EmployeePosition, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveSubordinatePositionIds } from '../utils/employee-position-hierarchy.util';
import {
  CreateEmployeePositionData,
  EmployeePositionHistoryRecord,
  EmployeePositionRecord,
  EmployeePositionSupervisorSummary,
  IEmployeePositionsRepository,
  ListEmployeePositionsOptions,
  UpdateEmployeePositionData,
} from '../interfaces/employee-positions.interfaces';

@Injectable()
export class EmployeePositionsRepository implements IEmployeePositionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    options: ListEmployeePositionsOptions = {},
  ): Promise<EmployeePositionRecord[]> {
    const where: Prisma.EmployeePositionWhereInput = {
      tenantId,
      ...(options.includeInactive ? {} : { isActive: true }),
      ...(options.area ? { area: options.area } : {}),
      ...(options.search
        ? {
            OR: [
              { title: { contains: options.search, mode: 'insensitive' } },
              { area: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.employeePosition.findMany({
      where,
      orderBy: [{ area: 'asc' }, { title: 'asc' }],
    });

    const supervisorsByPosition = await this.findSupervisorsByPositionIds(
      tenantId,
      rows.map((row) => row.id),
    );
    return rows.map((row) => this.mapPosition(row, supervisorsByPosition.get(row.id) ?? []));
  }

  async findById(tenantId: string, id: string): Promise<EmployeePositionRecord | null> {
    const row = await this.prisma.employeePosition.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      return null;
    }
    const supervisorsByPosition = await this.findSupervisorsByPositionIds(tenantId, [row.id]);
    return this.mapPosition(row, supervisorsByPosition.get(row.id) ?? []);
  }

  async findByTitle(tenantId: string, title: string): Promise<EmployeePositionRecord | null> {
    const row = await this.prisma.employeePosition.findFirst({
      where: { tenantId, title },
    });
    if (!row) {
      return null;
    }
    const supervisorsByPosition = await this.findSupervisorsByPositionIds(tenantId, [row.id]);
    return this.mapPosition(row, supervisorsByPosition.get(row.id) ?? []);
  }

  async findByIds(tenantId: string, ids: string[]): Promise<EmployeePositionRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.prisma.employeePosition.findMany({
      where: { tenantId, id: { in: ids } },
    });
    const supervisorsByPosition = await this.findSupervisorsByPositionIds(
      tenantId,
      rows.map((row) => row.id),
    );
    return rows.map((row) => this.mapPosition(row, supervisorsByPosition.get(row.id) ?? []));
  }

  async countActiveEmployeesByPosition(tenantId: string, positionId: string): Promise<number> {
    return this.prisma.employeeDetails.count({
      where: {
        tenantId,
        positionId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  /**
   * OS-633 — la fila del cargo y sus supervisores (si vienen en `data.supervisorPositionIds`)
   * se escriben en la misma transacción: si falla la creación de los vínculos de supervisor,
   * la fila del cargo tampoco queda creada (rollback completo, mismo patrón que
   * `AdminRolesRepository.duplicateRole`).
   */
  async create(
    tenantId: string,
    data: CreateEmployeePositionData,
  ): Promise<EmployeePositionRecord> {
    const supervisorPositionIds = data.supervisorPositionIds ?? [];

    const row = await this.prisma.$transaction(async (tx): Promise<EmployeePosition> => {
      const created = await tx.employeePosition.create({
        data: {
          tenantId,
          title: data.title,
          area: data.area,
          baseSalaryRange: data.baseSalaryRange,
        },
      });

      if (supervisorPositionIds.length > 0) {
        await tx.employeePositionSupervisor.createMany({
          data: supervisorPositionIds.map((supervisorPositionId) => ({
            tenantId,
            positionId: created.id,
            supervisorPositionId,
          })),
        });
      }

      return created;
    });

    const supervisorsByPosition = await this.findSupervisorsByPositionIds(tenantId, [row.id]);
    return this.mapPosition(row, supervisorsByPosition.get(row.id) ?? []);
  }

  /**
   * OS-633 — misma garantía transaccional que `create`: la actualización de los campos del
   * cargo y el reemplazo de sus supervisores (cuando `data.supervisorPositionIds` viene
   * definido) ocurren en la misma transacción. `undefined` = no tocar la relación existente.
   */
  async update(
    tenantId: string,
    id: string,
    data: UpdateEmployeePositionData,
  ): Promise<EmployeePositionRecord> {
    const row = await this.prisma.$transaction(async (tx): Promise<EmployeePosition> => {
      const updated = await tx.employeePosition.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.area !== undefined ? { area: data.area } : {}),
          ...(data.baseSalaryRange !== undefined ? { baseSalaryRange: data.baseSalaryRange } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });

      if (updated.tenantId !== tenantId) {
        throw new Error('Tenant mismatch after update');
      }

      if (data.supervisorPositionIds !== undefined) {
        await tx.employeePositionSupervisor.deleteMany({ where: { tenantId, positionId: id } });

        if (data.supervisorPositionIds.length > 0) {
          await tx.employeePositionSupervisor.createMany({
            data: data.supervisorPositionIds.map((supervisorPositionId) => ({
              tenantId,
              positionId: id,
              supervisorPositionId,
            })),
          });
        }
      }

      return updated;
    });

    const supervisorsByPosition = await this.findSupervisorsByPositionIds(tenantId, [id]);
    return this.mapPosition(row, supervisorsByPosition.get(id) ?? []);
  }

  async deactivate(tenantId: string, id: string): Promise<EmployeePositionRecord> {
    return this.update(tenantId, id, { isActive: false });
  }

  /** OS-633 — cargos supervisores directos por cada `positionId`, agrupados (`title` asc). */
  async findSupervisorsByPositionIds(
    tenantId: string,
    positionIds: string[],
  ): Promise<Map<string, EmployeePositionSupervisorSummary[]>> {
    const result = new Map<string, EmployeePositionSupervisorSummary[]>();
    if (positionIds.length === 0) {
      return result;
    }

    const rows = await this.prisma.employeePositionSupervisor.findMany({
      where: { tenantId, positionId: { in: positionIds } },
      select: { positionId: true, supervisorPosition: { select: { id: true, title: true } } },
      orderBy: { supervisorPosition: { title: 'asc' } },
    });

    for (const row of rows) {
      const list = result.get(row.positionId) ?? [];
      list.push({ id: row.supervisorPosition.id, title: row.supervisorPosition.title });
      result.set(row.positionId, list);
    }

    return result;
  }

  /** OS-633 — subordinados transitivos de `positionId`, mismo BFS reutilizado de OS-550. */
  async findSubordinatePositionIds(tenantId: string, positionId: string): Promise<string[]> {
    return resolveSubordinatePositionIds(this.prisma, tenantId, positionId);
  }

  async findHistoryByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeePositionHistoryRecord[]> {
    const rows = await this.prisma.employeePositionHistory.findMany({
      where: { tenantId, employeeDetailsId },
      orderBy: { effectiveFrom: 'desc' },
    });
    return rows.map((row) => this.mapHistory(row));
  }

  async closeOpenHistory(
    tenantId: string,
    employeeDetailsId: string,
    effectiveTo: Date,
  ): Promise<void> {
    await this.prisma.employeePositionHistory.updateMany({
      where: {
        tenantId,
        employeeDetailsId,
        effectiveTo: null,
      },
      data: { effectiveTo },
    });
  }

  async createHistoryEntry(data: {
    tenantId: string;
    employeeDetailsId: string;
    positionId: string;
    effectiveFrom: Date;
    changedBy?: string;
  }): Promise<EmployeePositionHistoryRecord> {
    const row = await this.prisma.employeePositionHistory.create({
      data: {
        tenantId: data.tenantId,
        employeeDetailsId: data.employeeDetailsId,
        positionId: data.positionId,
        effectiveFrom: data.effectiveFrom,
        changedBy: data.changedBy ?? null,
      },
    });
    return this.mapHistory(row);
  }

  private mapPosition(
    row: {
      id: string;
      tenantId: string;
      title: string;
      area: string;
      baseSalaryRange: Prisma.Decimal;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    supervisors: EmployeePositionSupervisorSummary[],
  ): EmployeePositionRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      title: row.title,
      area: row.area,
      baseSalaryRange: row.baseSalaryRange.toString(),
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      supervisors,
    };
  }

  private mapHistory(row: {
    id: string;
    tenantId: string;
    employeeDetailsId: string;
    positionId: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    changedBy: string | null;
    createdAt: Date;
  }): EmployeePositionHistoryRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeDetailsId: row.employeeDetailsId,
      positionId: row.positionId,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      changedBy: row.changedBy,
      createdAt: row.createdAt,
    };
  }
}
