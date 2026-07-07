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

    try {
      return await this.employeePositionsRepository.create(tenantId, data);
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

    try {
      return await this.employeePositionsRepository.update(tenantId, id, data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An active employee position with this title already exists');
      }
      throw error;
    }
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
