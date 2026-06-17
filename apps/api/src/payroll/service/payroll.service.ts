import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EmployeeContractType, SalaryType, EmployeeDetails, User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SMLV_2025, TRANSPORT_SUBSIDY_THRESHOLD } from '../payroll.constants';
import { PayrollRepository } from '../repository/payroll.repository';
import { IPayrollService } from '../interfaces/payroll.interfaces';
import type { UpdateEmployeePayload } from '../interfaces/payroll.interfaces';
import { decimalToNumber } from '../../common/utils/decimal.util';

const SALT_ROUNDS = 12;

@Injectable()
export class PayrollService implements IPayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(private readonly payrollRepository: PayrollRepository) {}

  async create(tenantId: string, data: any): Promise<EmployeeDetails & { user: User }> {
    this.validateColombiaLaw(tenantId, data);

    const existingUser = await this.payrollRepository.findExistingUser(
      tenantId,
      data.email,
      data.cedula,
    );
    if (existingUser) {
      this.logger.warn(
        `Validation error: User already exists (tenantId=${tenantId}, email=${data.email}, cedula=${data.cedula})`,
      );
      throw new ConflictException('Email or Cédula already registered');
    }

    const location = await this.payrollRepository.findLocationById(data.locationId);
    if (!location || location.tenantId !== tenantId) {
      throw new BadRequestException('Invalid location for this tenant');
    }

    const role = await this.payrollRepository.findRoleById(data.roleId);
    if (!role || role.tenantId !== tenantId) {
      throw new BadRequestException('Invalid role for this tenant');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const hasTransportSubsidy = this.calculateTransportSubsidy(data.salaryAmount);

    try {
      return await this.payrollRepository.create({
        ...data,
        tenantId,
        passwordHash,
        hasTransportSubsidy,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email or Cédula already registered');
      }

      throw error;
    }
  }

  async findAll(tenantId: string, filters: any): Promise<(EmployeeDetails & { user: User })[]> {
    return this.payrollRepository.findAll({
      ...filters,
      tenantId,
    });
  }

  async findOne(tenantId: string, userId: string): Promise<EmployeeDetails & { user: User }> {
    const employee = await this.payrollRepository.findByUserId(userId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Employee with userId "${userId}" not found`);
    }
    return employee;
  }

  async update(
    tenantId: string,
    userId: string,
    data: any,
  ): Promise<EmployeeDetails & { user: User; location?: { id: string; name: string } }> {
    const employee = await this.findOne(tenantId, userId);

    if (data.salaryAmount !== undefined) {
      this.validateSalary(tenantId, { ...employee, ...data }, userId);
      data.hasTransportSubsidy = this.calculateTransportSubsidy(Number(data.salaryAmount));
    }

    if (data.contractType !== undefined || data.contractEnd !== undefined) {
      this.validateContractDates(tenantId, { ...employee, ...data }, userId);
    }

    if (data.locationId) {
      const location = await this.payrollRepository.findLocationById(data.locationId);
      if (!location || location.tenantId !== tenantId) {
        throw new BadRequestException('Invalid location for this tenant');
      }
    }

    if (data.roleId) {
      const role = await this.payrollRepository.findRoleById(data.roleId);
      if (!role || role.tenantId !== tenantId) {
        throw new BadRequestException('Invalid role for this tenant');
      }
    }

    if (data.email || data.cedula) {
      const existingUser = await this.payrollRepository.findExistingUser(
        tenantId,
        data.email ?? employee.user.email,
        data.cedula ?? employee.user.cedula,
      );
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email or Cédula already registered');
      }
    }

    const payload = this.buildUpdatePayload(data);

    if (data.password) {
      payload.user = {
        ...payload.user,
        passwordHash: await bcrypt.hash(data.password, SALT_ROUNDS),
      };
    }

    try {
      return await this.payrollRepository.update(userId, payload);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email or Cédula already registered');
      }

      throw error;
    }
  }

  async remove(tenantId: string, userId: string): Promise<void> {
    await this.findOne(tenantId, userId);
    await this.payrollRepository.softDelete(userId);
  }

  async findByLocation(
    tenantId: string,
    locationId: string,
  ): Promise<(EmployeeDetails & { user: User })[]> {
    return this.payrollRepository.findAll({ tenantId, locationId });
  }

  async findByContractType(
    tenantId: string,
    contractType: EmployeeContractType,
  ): Promise<(EmployeeDetails & { user: User })[]> {
    return this.payrollRepository.findAll({ tenantId, contractType });
  }

  private validateColombiaLaw(tenantId: string, data: any, userId?: string) {
    this.validateSalary(tenantId, data, userId);
    this.validateContractDates(tenantId, data, userId);
  }

  private validateSalary(tenantId: string, data: any, userId?: string) {
    const amount = Number(data.salaryAmount);

    if (amount <= 0) {
      this.logAndThrow(tenantId, 'Salary amount must be greater than 0', userId);
    }

    if (data.contractType === EmployeeContractType.PRESTACION && amount < SMLV_2025) {
      this.logAndThrow(
        tenantId,
        `PRESTACION contract must have at least 1 SMLV (${SMLV_2025})`,
        userId,
      );
    }

    if (data.contractType === EmployeeContractType.APRENDIZAJE) {
      if (amount < SMLV_2025 * 0.5 || amount > SMLV_2025) {
        this.logAndThrow(
          tenantId,
          `APRENDIZAJE contract must be between 0.5 and 1 SMLV (${SMLV_2025 * 0.5} - ${SMLV_2025})`,
          userId,
        );
      }
    }

    if (data.salaryType === SalaryType.INTEGRAL && amount < SMLV_2025 * 13) {
      this.logAndThrow(
        tenantId,
        `INTEGRAL salary type must have at least 13 SMLV (${SMLV_2025 * 13})`,
        userId,
      );
    }
  }

  private validateContractDates(tenantId: string, data: any, userId?: string) {
    if (
      (data.contractType === EmployeeContractType.FIJO ||
        data.contractType === EmployeeContractType.OBRA) &&
      !data.contractEnd
    ) {
      this.logAndThrow(
        tenantId,
        'Contract end date is required for FIJO and OBRA contracts',
        userId,
      );
    }

    if (
      data.contractStart &&
      data.contractEnd &&
      new Date(data.contractStart) > new Date(data.contractEnd)
    ) {
      this.logAndThrow(
        tenantId,
        'Contract start date must be before or equal to contract end date',
        userId,
      );
    }
  }

  private calculateTransportSubsidy(salaryAmount: number): boolean {
    return salaryAmount <= TRANSPORT_SUBSIDY_THRESHOLD;
  }

  private logAndThrow(tenantId: string, message: string, userId?: string) {
    const context = `tenantId=${tenantId}${userId ? `, userId=${userId}` : ''}`;
    this.logger.warn(`Validation error: ${message} (${context})`);
    throw new UnprocessableEntityException(message);
  }

  private buildUpdatePayload(data: Record<string, unknown>): UpdateEmployeePayload {
    const employee: UpdateEmployeePayload['employee'] = {};
    const user: NonNullable<UpdateEmployeePayload['user']> = {};

    const employeeScalars = [
      'locationId',
      'name',
      'position',
      'area',
      'department',
      'contractType',
      'salaryType',
      'salaryAmount',
      'hasTransportSubsidy',
      'epsName',
      'pensionFundName',
      'cesantiasFundName',
      'arlName',
      'arlRiskLevel',
      'cajaCompensacion',
      'isActive',
    ] as const;

    for (const field of employeeScalars) {
      if (data[field] !== undefined) {
        (employee as Record<string, unknown>)[field] = data[field];
      }
    }

    if (data.hireDate !== undefined) {
      employee.hireDate = data.hireDate as string;
    }

    if (data.contractStart !== undefined) {
      employee.contractStart = data.contractStart as string;
    }

    if (data.contractEnd !== undefined) {
      employee.contractEnd = (data.contractEnd as string | null) || null;
    }

    if (data.cedula !== undefined) user.cedula = data.cedula as string;
    if (data.documentType !== undefined)
      user.documentType = data.documentType as User['documentType'];
    if (data.email !== undefined) user.email = data.email as string;
    if (data.roleId !== undefined) user.roleId = data.roleId as string;

    const payload: UpdateEmployeePayload = { employee };
    if (Object.keys(user).length > 0) {
      payload.user = user;
    }

    return payload;
  }
}
