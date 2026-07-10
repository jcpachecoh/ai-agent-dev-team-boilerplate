import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { resolveSubordinatePositionIds } from '../../payroll/utils/employee-position-hierarchy.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ATTENDANCE_COLLABORATORS_SUPERVISOR_ROLES } from '../attendance-collaborators.constants';
import type {
  CollaboratorRecord,
  CollaboratorSupervisorSummary,
  CollaboratorTodayShift,
  CollaboratorsPage,
  IAttendanceCollaboratorsRepository,
  ListCollaboratorsFilters,
} from '../interfaces/attendance-collaborators.interfaces';

@Injectable()
export class AttendanceCollaboratorsRepository implements IAttendanceCollaboratorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(filters: ListCollaboratorsFilters): Promise<CollaboratorsPage> {
    const where: Prisma.EmployeeDetailsWhereInput = {
      tenantId: filters.tenantId,
      deletedAt: null,
    };

    if (filters.status === 'active') {
      where.isActive = true;
    } else if (filters.status === 'inactive') {
      where.isActive = false;
    }

    const positionFilter = this.intersectPositionFilter(
      filters.allowedPositionIds,
      filters.positionId,
    );
    if (positionFilter === 'EMPTY') {
      return { items: [], total: 0, activeTotal: 0, inactiveTotal: 0 };
    }
    if (positionFilter) {
      where.positionId = { in: positionFilter };
    }

    if (filters.contractType) {
      where.contractType = filters.contractType;
    }

    if (filters.area) {
      where.area = filters.area;
    }

    if (filters.laborClassification === 'administrativo') {
      where.laborClassification = 'ADMINISTRATIVO';
    } else if (filters.laborClassification === 'operaciones') {
      where.laborClassification = { in: ['COCINA', 'SERVICIO'] };
    }

    const locationFilter = this.intersectLocationFilter(
      filters.allowedLocationIds,
      filters.locationId,
    );
    if (locationFilter === 'EMPTY') {
      return { items: [], total: 0, activeTotal: 0, inactiveTotal: 0 };
    }
    if (locationFilter) {
      where.locationId = { in: locationFilter };
    }

    const search = filters.search?.trim();
    if (search) {
      const matchedIds = await this.findMatchingIdsBySearch(filters.tenantId, search);
      if (matchedIds.length === 0) {
        return { items: [], total: 0, activeTotal: 0, inactiveTotal: 0 };
      }
      where.id = { in: matchedIds };
    }

    const [total, activeTotal, inactiveTotal, rows] = await Promise.all([
      this.prisma.employeeDetails.count({ where }),
      this.prisma.employeeDetails.count({ where: { ...where, isActive: true } }),
      this.prisma.employeeDetails.count({ where: { ...where, isActive: false } }),
      this.prisma.employeeDetails.findMany({
        where,
        orderBy: this.buildOrderBy(filters.sortBy, filters.sortDir),
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        select: {
          id: true,
          userId: true,
          locationId: true,
          name: true,
          area: true,
          positionId: true,
          position: true,
          contractType: true,
          laborClassification: true,
          isActive: true,
          portalWorkerEnabled: true,
          location: { select: { name: true } },
          personalData: { select: { primerApellido: true, segundoApellido: true } },
          user: { select: { cedula: true, email: true } },
        },
      }),
    ]);

    return {
      total,
      activeTotal,
      inactiveTotal,
      items: rows.map(
        (row): CollaboratorRecord => ({
          id: row.id,
          userId: row.userId,
          locationId: row.locationId,
          locationName: row.location?.name ?? null,
          name: row.name,
          primerApellido: row.personalData?.primerApellido ?? null,
          segundoApellido: row.personalData?.segundoApellido ?? null,
          cedula: row.user.cedula,
          email: row.user.email,
          positionId: row.positionId,
          positionName: row.position,
          area: row.area,
          contractType: row.contractType,
          laborClassification: row.laborClassification,
          isActive: row.isActive,
          portalWorkerEnabled: row.portalWorkerEnabled,
        }),
      ),
    };
  }

  /**
   * Búsqueda case+accent insensitive sin depender de una extensión de Postgres
   * (no hay `unaccent`/`citext`/`pg_trgm` habilitada en este proyecto). `translate()`
   * es una función nativa del núcleo de Postgres — sustituye caracteres acentuados
   * comunes del español antes de comparar con LIKE, todo parametrizado vía
   * Prisma.sql (nunca interpolación de strings del usuario).
   */
  async findMatchingIdsBySearch(tenantId: string, search: string): Promise<string[]> {
    const needle = `%${this.normalizeForSearch(search)}%`;

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT ed.id FROM employee_details ed
      JOIN users u ON u.id = ed."userId"
      LEFT JOIN employee_personal_data epd ON epd."employeeDetailsId" = ed.id
      WHERE ed."tenantId" = ${tenantId}
        AND ed."deletedAt" IS NULL
        AND translate(
          lower(concat_ws(' ', ed.name, epd."primerApellido", epd."segundoApellido", u.cedula, u.email)),
          'áéíóúüñÁÉÍÓÚÜÑ',
          'aeiouunAEIOUUN'
        ) LIKE ${needle}
    `);

    return rows.map((row) => row.id);
  }

  private buildOrderBy(
    sortBy: ListCollaboratorsFilters['sortBy'],
    sortDir: ListCollaboratorsFilters['sortDir'],
  ): Prisma.EmployeeDetailsOrderByWithRelationInput {
    const direction = sortDir ?? 'asc';
    if (sortBy === 'employee') return { name: direction };
    if (sortBy === 'role') return { position: direction };
    if (sortBy === 'hireDate') return { hireDate: direction };
    return { createdAt: 'desc' };
  }

  private normalizeForSearch(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  async findSupervisorsForLocations(
    tenantId: string,
    locationIds: string[],
  ): Promise<Map<string, CollaboratorSupervisorSummary[]>> {
    const result = new Map<string, CollaboratorSupervisorSummary[]>();
    if (locationIds.length === 0) {
      return result;
    }

    const rows = await this.prisma.userLocation.findMany({
      where: {
        tenantId,
        locationId: { in: locationIds },
        user: {
          isActive: true,
          deletedAt: null,
          role: { code: { in: [...ATTENDANCE_COLLABORATORS_SUPERVISOR_ROLES] } },
        },
      },
      select: {
        locationId: true,
        user: {
          select: {
            id: true,
            email: true,
            employeeDetails: { select: { name: true } },
          },
        },
      },
    });

    for (const row of rows) {
      const summary: CollaboratorSupervisorSummary = {
        id: row.user.id,
        name: row.user.employeeDetails?.name ?? row.user.email,
        email: row.user.email,
      };
      const existing = result.get(row.locationId);
      if (existing) {
        existing.push(summary);
      } else {
        result.set(row.locationId, [summary]);
      }
    }

    return result;
  }

  async findTodayAssignments(
    tenantId: string,
    employeeIds: string[],
    today: Date,
  ): Promise<Map<string, CollaboratorTodayShift>> {
    const result = new Map<string, CollaboratorTodayShift>();
    if (employeeIds.length === 0) {
      return result;
    }

    const rows = await this.prisma.turnoAssignment.findMany({
      where: { tenantId, employeeId: { in: employeeIds }, workDate: today },
      include: { turno: true },
    });

    for (const row of rows) {
      if (row.type === 'REST') {
        result.set(row.employeeId, { type: 'REST', turno: null });
        continue;
      }

      result.set(row.employeeId, {
        type: 'ASSIGNED',
        turno: row.turno
          ? {
              id: row.turno.id,
              nombre: row.turno.nombre,
              sigla: row.turno.sigla,
              horaInicio: row.turno.horaInicio,
              horaFin: row.turno.horaFin,
              jornada: row.turno.jornada,
            }
          : null,
      });
    }

    return result;
  }

  async findSupervisorUser(
    tenantId: string,
    userId: string,
  ): Promise<{ id: string; roleCode: string; positionId: string | null } | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: {
        id: true,
        role: { select: { code: true } },
        employeeDetails: { select: { positionId: true } },
      },
    });
    return user
      ? {
          id: user.id,
          roleCode: user.role.code,
          positionId: user.employeeDetails?.positionId ?? null,
        }
      : null;
  }

  /**
   * OS-550 follow-up — cargos que reportan a `supervisorPositionId`, de forma **transitiva**
   * (todo el subárbol, no solo los hijos directos). Ej.: filtrar por "Gerente General" debe
   * traer Director de Operaciones, Administrador, Administrador Junior, Cocina, Parrillero, etc.
   * — todo lo que cuelga de él en el organigrama, no un solo nivel.
   *
   * OS-633: BFS compartido con `VacationsRepository` y `EmployeePositionsRepository` — ver
   * `resolveSubordinatePositionIds` para el detalle de la traversal y su justificación.
   */
  async findSubordinatePositionIds(
    tenantId: string,
    supervisorPositionId: string,
  ): Promise<string[]> {
    return resolveSubordinatePositionIds(this.prisma, tenantId, supervisorPositionId);
  }

  /** OS-550 follow-up — título(s) del/los cargo(s) supervisor(es) de cada `positionId`, para la columna Supervisor. */
  async findSupervisorPositionNamesByPosition(
    tenantId: string,
    positionIds: string[],
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (positionIds.length === 0) {
      return result;
    }

    const rows = await this.prisma.employeePositionSupervisor.findMany({
      where: { tenantId, positionId: { in: positionIds } },
      select: { positionId: true, supervisorPosition: { select: { title: true } } },
    });

    for (const row of rows) {
      const existing = result.get(row.positionId);
      result.set(
        row.positionId,
        existing ? `${existing}, ${row.supervisorPosition.title}` : row.supervisorPosition.title,
      );
    }

    return result;
  }

  async findSupervisorOptions(
    tenantId: string,
    allowedLocationIds: string[] | null,
  ): Promise<CollaboratorSupervisorSummary[]> {
    const where: Prisma.UserWhereInput = {
      tenantId,
      isActive: true,
      deletedAt: null,
      role: { code: { in: [...ATTENDANCE_COLLABORATORS_SUPERVISOR_ROLES] } },
    };

    if (allowedLocationIds) {
      where.userLocations = { some: { locationId: { in: allowedLocationIds } } };
    }

    const rows = await this.prisma.user.findMany({
      where,
      select: { id: true, email: true, employeeDetails: { select: { name: true } } },
      orderBy: { email: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.employeeDetails?.name ?? row.email,
      email: row.email,
    }));
  }

  async findEmployeeForPortalToggle(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<{ id: string; portalWorkerEnabled: boolean } | null> {
    return this.prisma.employeeDetails.findFirst({
      where: { id: employeeDetailsId, tenantId, deletedAt: null },
      select: { id: true, portalWorkerEnabled: true },
    });
  }

  async updatePortalWorkerEnabled(employeeDetailsId: string, enabled: boolean): Promise<void> {
    await this.prisma.employeeDetails.update({
      where: { id: employeeDetailsId },
      data: { portalWorkerEnabled: enabled },
    });
  }

  /** Intersecta el scope de sede del caller con el filtro `locationId` (single value) pedido explícitamente. */
  private intersectLocationFilter(
    allowedLocationIds: string[] | null,
    requestedLocationId: string | undefined,
  ): string[] | 'EMPTY' | null {
    if (!allowedLocationIds) {
      return requestedLocationId ? [requestedLocationId] : null;
    }
    if (!requestedLocationId) {
      return allowedLocationIds;
    }
    return allowedLocationIds.includes(requestedLocationId) ? [requestedLocationId] : 'EMPTY';
  }

  /**
   * OS-550 follow-up — intersecta los cargos subordinados del supervisor filtrado
   * (`allowedPositionIds`) con el filtro Especialidad (`positionId`) pedido explícitamente.
   * Mismo patrón que `intersectLocationFilter`: `allowedPositionIds: null` = sin restricción
   * por cargo (no se filtró por supervisor, o el supervisor no tiene jerarquía configurada).
   */
  private intersectPositionFilter(
    allowedPositionIds: string[] | null,
    requestedPositionId: string | undefined,
  ): string[] | 'EMPTY' | null {
    if (!allowedPositionIds) {
      return requestedPositionId ? [requestedPositionId] : null;
    }
    if (!requestedPositionId) {
      return allowedPositionIds;
    }
    return allowedPositionIds.includes(requestedPositionId) ? [requestedPositionId] : 'EMPTY';
  }
}
