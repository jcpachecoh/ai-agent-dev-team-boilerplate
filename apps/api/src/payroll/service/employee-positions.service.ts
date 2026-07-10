import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreateEmployeePositionData,
  EmployeePositionHistoryRecord,
  EmployeePositionRecord,
  IEmployeePositionsService,
  ListEmployeePositionsOptions,
  UpdateEmployeePositionData,
} from '../interfaces/employee-positions.interfaces';
import { EmployeePositionsRepository } from '../repository/employee-positions.repository';
import { PayrollRepository } from '../repository/payroll.repository';

@Injectable()
export class EmployeePositionsService implements IEmployeePositionsService {
  constructor(
    private readonly employeePositionsRepository: EmployeePositionsRepository,
    private readonly payrollRepository: PayrollRepository,
  ) {}

  async findAll(
    tenantId: string,
    options?: ListEmployeePositionsOptions,
  ): Promise<EmployeePositionRecord[]> {
    return this.employeePositionsRepository.findAll(tenantId, options);
  }

  async findById(tenantId: string, id: string): Promise<EmployeePositionRecord> {
    const position = await this.employeePositionsRepository.findById(tenantId, id);
    if (!position) {
      throw new NotFoundException(`Employee position "${id}" not found`);
    }
    return position;
  }

  async create(
    tenantId: string,
    data: CreateEmployeePositionData,
  ): Promise<EmployeePositionRecord> {
    this.validateBaseSalaryRange(data.baseSalaryRange);

    const existing = await this.employeePositionsRepository.findByTitle(tenantId, data.title);
    if (existing) {
      throw new ConflictException('An active employee position with this title already exists');
    }

    const supervisorPositionIds = await this.validateSupervisorPositionIds(
      tenantId,
      undefined,
      data.supervisorPositionIds,
    );

    try {
      // La fila del cargo y sus supervisores se persisten en una misma transacción dentro
      // del repository — si falla uno, no queda el otro parcialmente escrito.
      return await this.employeePositionsRepository.create(tenantId, {
        title: data.title,
        area: data.area,
        baseSalaryRange: data.baseSalaryRange,
        supervisorPositionIds,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An active employee position with this title already exists');
      }
      throw error;
    }
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateEmployeePositionData,
  ): Promise<EmployeePositionRecord> {
    await this.findById(tenantId, id);

    if (data.baseSalaryRange !== undefined) {
      this.validateBaseSalaryRange(data.baseSalaryRange);
    }

    if (data.title) {
      const existing = await this.employeePositionsRepository.findByTitle(tenantId, data.title);
      if (existing && existing.id !== id) {
        throw new ConflictException('An active employee position with this title already exists');
      }
    }

    const supervisorPositionIds =
      data.supervisorPositionIds !== undefined
        ? await this.validateSupervisorPositionIds(tenantId, id, data.supervisorPositionIds)
        : undefined;

    try {
      // Igual que en `create`: los campos del cargo y el reemplazo de supervisores (si
      // `supervisorPositionIds` viene definido) se persisten en una misma transacción.
      return await this.employeePositionsRepository.update(tenantId, id, {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.area !== undefined ? { area: data.area } : {}),
        ...(data.baseSalaryRange !== undefined ? { baseSalaryRange: data.baseSalaryRange } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(supervisorPositionIds !== undefined ? { supervisorPositionIds } : {}),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An active employee position with this title already exists');
      }
      throw error;
    }
  }

  /**
   * OS-633 — valida el set de `supervisorPositionIds` antes de persistirlo:
   *  1. Un cargo no puede supervisarse a sí mismo.
   *  2. Todos los ids deben existir y pertenecer al mismo tenant (`findByIds` ya filtra por tenant,
   *     así que un id de otro tenant simplemente no aparece — se reporta como inválido).
   *  3. Ninguno puede ya ser subordinado (directo o transitivo) del cargo — eso cerraría un ciclo.
   *     `positionId` es `undefined` en creación: un cargo nuevo no tiene subordinados todavía,
   *     así que el chequeo de ciclos no aplica.
   */
  private async validateSupervisorPositionIds(
    tenantId: string,
    positionId: string | undefined,
    supervisorPositionIds: string[] | undefined,
  ): Promise<string[]> {
    if (!supervisorPositionIds || supervisorPositionIds.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(supervisorPositionIds)];

    if (positionId && uniqueIds.includes(positionId)) {
      throw new BadRequestException('A position cannot be its own supervisor');
    }

    const existingPositions = await this.employeePositionsRepository.findByIds(tenantId, uniqueIds);
    if (existingPositions.length !== uniqueIds.length) {
      const foundIds = new Set(existingPositions.map((position) => position.id));
      const missingIds = uniqueIds.filter((supervisorId) => !foundIds.has(supervisorId));
      throw new BadRequestException(
        `Invalid supervisor position id(s) for this tenant: ${missingIds.join(', ')}`,
      );
    }

    if (positionId) {
      const subordinateIds = await this.employeePositionsRepository.findSubordinatePositionIds(
        tenantId,
        positionId,
      );
      const cyclicIds = uniqueIds.filter((supervisorId) => subordinateIds.includes(supervisorId));
      if (cyclicIds.length > 0) {
        throw new ConflictException(
          `Assigning position(s) ${cyclicIds.join(', ')} as supervisor would create a hierarchy cycle`,
        );
      }
    }

    return uniqueIds;
  }

  async deactivate(tenantId: string, id: string): Promise<EmployeePositionRecord> {
    await this.findById(tenantId, id);

    const activeCount = await this.employeePositionsRepository.countActiveEmployeesByPosition(
      tenantId,
      id,
    );
    if (activeCount > 0) {
      throw new ConflictException('Cannot deactivate position with active employees assigned');
    }

    return this.employeePositionsRepository.deactivate(tenantId, id);
  }

  async getEmployeePositionHistory(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeePositionHistoryRecord[]> {
    const employee = await this.payrollRepository.findById(employeeDetailsId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Employee with id "${employeeDetailsId}" not found`);
    }

    return this.employeePositionsRepository.findHistoryByEmployee(tenantId, employeeDetailsId);
  }

  async assignPositionToEmployee(
    tenantId: string,
    employeeDetailsId: string,
    positionId: string,
    changedBy?: string,
  ): Promise<void> {
    const position = await this.findById(tenantId, positionId);
    if (!position.isActive) {
      throw new BadRequestException('Cannot assign an inactive position to an employee');
    }

    const employee = await this.payrollRepository.findById(employeeDetailsId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Employee with id "${employeeDetailsId}" not found`);
    }

    if (employee.positionId === positionId) {
      return;
    }

    const now = new Date();
    await this.employeePositionsRepository.closeOpenHistory(tenantId, employeeDetailsId, now);
    await this.employeePositionsRepository.createHistoryEntry({
      tenantId,
      employeeDetailsId,
      positionId,
      effectiveFrom: now,
      changedBy,
    });
    await this.payrollRepository.updateEmployeePositionAssignment(employeeDetailsId, {
      positionId,
      position: position.title,
    });
  }

  private validateBaseSalaryRange(value: string): void {
    const amount = Number(value);
    if (Number.isNaN(amount) || amount < 0) {
      throw new BadRequestException('baseSalaryRange must be greater than or equal to 0');
    }
  }
}
