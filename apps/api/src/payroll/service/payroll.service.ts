import * as crypto from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  EmployeeContractType,
  SalaryType,
  EmployeeDetails,
  User,
  Prisma,
  AuditAction,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { DEFAULT_EMPLOYEE_BOOTSTRAP_ROLE_CODE } from '../payroll.constants';
import { EmployeeDeactivationGuardService } from './employee-deactivation-guard.service';
import { EmployeePositionsService } from './employee-positions.service';
import { AuditService } from '../../audit/service/audit.service';
import { EmployeeSocialProfileService } from '../../employee-social-profile/service/employee-social-profile.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { StorageDomain } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import type { CreateBeneficiaryDto } from '../controller/dto/create-beneficiary.dto';
import {
  IPayrollService,
  type PayrollActor,
  type UpdateEmployeePayload,
} from '../interfaces/payroll.interfaces';
import { PayrollRepository } from '../repository/payroll.repository';

const SALT_ROUNDS = 12;

// Converts a Prisma model record to a plain JSON-serializable object safe for AuditLog.
// JSON.stringify handles Decimal via Decimal.toJSON() and Date via the replacer.
function toAuditJson(value: unknown): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (v instanceof Date ? v.toISOString() : v)),
  ) as Record<string, unknown>;
}

@Injectable()
export class PayrollService implements IPayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private readonly payrollRepository: PayrollRepository,
    private readonly employeePositionsService: EmployeePositionsService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly socialProfileService: EmployeeSocialProfileService,
    private readonly userLocationsService: UserLocationsService,
    private readonly legalParametersService: LaborLegalParametersService,
    private readonly deactivationGuard: EmployeeDeactivationGuardService,
  ) {}

  /** Sedes permitidas para lectura: null = sin restricción; valida `requestedLocationId` si se pidió una sede puntual. */
  private async resolveLocationScope(
    tenantId: string,
    actor: PayrollActor,
    requestedLocationId?: string,
  ): Promise<string[] | null> {
    const allowedLocationIds = await this.userLocationsService.resolveAllowedLocationIds(
      tenantId,
      actor,
    );
    if (requestedLocationId) {
      this.userLocationsService.assertLocationAllowed(allowedLocationIds, requestedLocationId);
    }
    return allowedLocationIds;
  }

  async create(
    tenantId: string,
    data: any,
    changedBy?: string,
  ): Promise<EmployeeDetails & { user: User }> {
    await this.validateColombiaLaw(tenantId, data);

    const linkedUserId = await this.resolveLinkedUserId(tenantId, data);
    await this.resolvePositionForEmployee(tenantId, data);
    const positionId = data.positionId as string | undefined;

    const location = await this.payrollRepository.findLocationById(data.locationId);
    if (!location || location.tenantId !== tenantId) {
      throw new BadRequestException('Invalid location for this tenant');
    }

    const roleId = await this.resolveRoleIdForCreate(tenantId, data.roleId, linkedUserId);

    const hasTransportSubsidy = await this.calculateTransportSubsidy(tenantId, data.salaryAmount);
    const passwordHash =
      linkedUserId === undefined
        ? await bcrypt.hash(crypto.randomBytes(16).toString('hex'), SALT_ROUNDS)
        : undefined;

    try {
      const employee = await this.payrollRepository.create({
        tenantId,
        userId: linkedUserId,
        roleId,
        email: data.email,
        cedula: data.cedula,
        documentType: data.documentType,
        passwordHash,
        locationId: data.locationId,
        name: data.name,
        position: data.position,
        area: data.area,
        department: data.department,
        contractType: data.contractType,
        hireDate: new Date(data.hireDate),
        contractStart: new Date(data.contractStart),
        contractEnd: data.contractEnd ? new Date(data.contractEnd) : null,
        salaryType: data.salaryType,
        salaryAmount: data.salaryAmount,
        epsName: data.epsName,
        pensionFundName: data.pensionFundName,
        cesantiasFundName: data.cesantiasFundName,
        arlName: data.arlName,
        arlRiskLevel: data.arlRiskLevel,
        cajaCompensacion: data.cajaCompensacion,
        barrio: data.barrio,
        localidad: data.localidad,
        costCenter: data.costCenter,
        laborClassification: data.laborClassification,
        nonSalaryAmount: data.nonSalaryAmount,
        hasTransportSubsidy,
        changedBy,
      });

      if (positionId) {
        await this.employeePositionsService.assignPositionToEmployee(
          tenantId,
          employee.id,
          positionId,
          changedBy,
        );
      }

      await this.syncBeneficiaries(tenantId, employee.id, data.beneficiaries ?? []);

      const refreshed = await this.payrollRepository.findByUserId(employee.userId);
      const result = refreshed ?? employee;

      await this.auditService.log({
        tenantId,
        action: AuditAction.CREATE,
        entityType: 'EmployeeDetails',
        entityId: result.id,
        actorUserId: changedBy ?? null,
        newValue: toAuditJson(result),
      });

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email or Cédula already registered');
      }

      throw error;
    }
  }

  private async resolveLinkedUserId(tenantId: string, data: any): Promise<string | undefined> {
    const [byEmail, byCedula] = await Promise.all([
      this.payrollRepository.findUserByEmail(tenantId, data.email),
      this.payrollRepository.findUserByCedula(tenantId, data.cedula),
    ]);

    if (byEmail && byCedula && byEmail.id !== byCedula.id) {
      throw new ConflictException('El email y la cédula pertenecen a usuarios distintos');
    }

    const linkedUser = byEmail ?? byCedula;
    if (!linkedUser) {
      return undefined;
    }

    if (byEmail && data.cedula !== byEmail.cedula) {
      throw new ConflictException(
        'La cédula no coincide con el usuario registrado para este email',
      );
    }

    if (byCedula && data.email !== byCedula.email) {
      throw new ConflictException(
        'El email no coincide con el usuario registrado para esta cédula',
      );
    }

    const existingEmployee = await this.payrollRepository.findByUserId(linkedUser.id);
    if (existingEmployee) {
      throw new ConflictException('Este usuario ya está registrado como empleado');
    }

    return linkedUser.id;
  }

  private async resolveRoleIdForCreate(
    tenantId: string,
    roleId: string | undefined,
    linkedUserId: string | undefined,
  ): Promise<string | undefined> {
    if (linkedUserId) {
      return undefined;
    }

    if (roleId) {
      const role = await this.payrollRepository.findRoleById(roleId);
      if (!role || role.tenantId !== tenantId) {
        throw new BadRequestException('Invalid role for this tenant');
      }
      return roleId;
    }

    const defaultRole = await this.payrollRepository.findRoleByTenantAndCode(
      tenantId,
      DEFAULT_EMPLOYEE_BOOTSTRAP_ROLE_CODE,
    );
    if (!defaultRole) {
      throw new BadRequestException(
        'No se encontró un rol por defecto para crear el usuario. Asigne el rol en Usuarios.',
      );
    }

    return defaultRole.id;
  }

  async findAll(
    tenantId: string,
    filters: any,
    actor: PayrollActor,
  ): Promise<(EmployeeDetails & { user: User })[]> {
    const allowedLocationIds = await this.resolveLocationScope(
      tenantId,
      actor,
      filters?.locationId,
    );
    return this.payrollRepository.findAll({
      ...filters,
      tenantId,
      allowedLocationIds,
    });
  }

  async findOne(
    tenantId: string,
    userId: string,
    actor: PayrollActor,
  ): Promise<EmployeeDetails & { user: User }> {
    const employee = await this.findEmployeeOrThrow(tenantId, userId);
    await this.resolveLocationScope(tenantId, actor, employee.locationId);
    return employee;
  }

  /** Autoservicio — empleado vinculado al usuario autenticado (sin scoping de sede). */
  async findSelf(tenantId: string, userId: string): Promise<EmployeeDetails & { user: User }> {
    return this.findEmployeeOrThrow(tenantId, userId);
  }

  /** Búsqueda sin scoping de sede: uso interno de `update`/`remove` (escritura, ya acotada por PAYROLL_WRITE_ROLES). */
  private async findEmployeeOrThrow(
    tenantId: string,
    userId: string,
  ): Promise<EmployeeDetails & { user: User }> {
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
    changedBy?: string,
  ): Promise<EmployeeDetails & { user: User; location?: { id: string; name: string } }> {
    const employee = await this.findEmployeeOrThrow(tenantId, userId);

    // OS-591 (fase 3) — ruta alterna de desactivación (`isActive: false` vía update
    // genérico). Debe pasar por el mismo gate que `remove()` — ver
    // EmployeeDeactivationGuardService y tasks/OS-591.md §15.5.
    const requestedIsActive = (data as { isActive?: boolean }).isActive;
    if (requestedIsActive === false) {
      await this.deactivationGuard.assertCanDeactivate(tenantId, employee.id, changedBy ?? null);
    }

    const nextPositionId = data.positionId as string | undefined;

    if (nextPositionId !== undefined) {
      if (!nextPositionId) {
        throw new BadRequestException('positionId cannot be cleared');
      }
      await this.resolvePositionForEmployee(tenantId, data);
    }

    if (data.salaryAmount !== undefined) {
      await this.validateSalary(tenantId, { ...employee, ...data }, userId);
      data.hasTransportSubsidy = await this.calculateTransportSubsidy(
        tenantId,
        Number(data.salaryAmount),
      );
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

    if (data.photoStorageObjectId !== undefined) {
      await this.validateAndSwapPhoto(tenantId, employee, data.photoStorageObjectId);
    }

    const payload = this.buildUpdatePayload(data, changedBy);

    try {
      const updated = await this.payrollRepository.update(userId, payload);

      if (nextPositionId !== undefined && nextPositionId !== employee.positionId) {
        await this.employeePositionsService.assignPositionToEmployee(
          tenantId,
          employee.id,
          nextPositionId,
          changedBy,
        );
      }

      if (data.beneficiaries !== undefined) {
        await this.syncBeneficiaries(tenantId, employee.id, data.beneficiaries ?? []);
      }

      const refreshed = await this.payrollRepository.findByUserId(userId);
      const result = refreshed ?? updated;

      await this.auditService.log({
        tenantId,
        action: AuditAction.UPDATE,
        entityType: 'EmployeeDetails',
        entityId: employee.id,
        actorUserId: changedBy ?? null,
        oldValue: toAuditJson(employee),
        newValue: toAuditJson(result),
      });

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email or Cédula already registered');
      }

      throw error;
    }
  }

  async remove(
    tenantId: string,
    userId: string,
    changedBy?: string,
  ): Promise<EmployeeDetails & { user: User }> {
    const employee = await this.findEmployeeOrThrow(tenantId, userId);
    // OS-591 (fase 3) — gate único de desactivación (ver tasks/OS-591.md §15.5).
    await this.deactivationGuard.assertCanDeactivate(tenantId, employee.id, changedBy ?? null);
    return this.payrollRepository.softDelete(userId);
  }

  async findByLocation(
    tenantId: string,
    locationId: string,
    actor: PayrollActor,
  ): Promise<(EmployeeDetails & { user: User })[]> {
    await this.resolveLocationScope(tenantId, actor, locationId);
    return this.payrollRepository.findAll({ tenantId, locationId });
  }

  async findByContractType(
    tenantId: string,
    contractType: EmployeeContractType,
    actor: PayrollActor,
  ): Promise<(EmployeeDetails & { user: User })[]> {
    const allowedLocationIds = await this.resolveLocationScope(tenantId, actor);
    return this.payrollRepository.findAll({ tenantId, contractType, allowedLocationIds });
  }

  private async resolvePositionForEmployee(
    tenantId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (data.positionId) {
      const catalogPosition = await this.employeePositionsService.findById(
        tenantId,
        data.positionId as string,
      );
      data.position = catalogPosition.title;
      if (!data.area) {
        data.area = catalogPosition.area;
      }
      return;
    }

    if (!data.position) {
      throw new BadRequestException('position or positionId is required');
    }
  }

  private async validateColombiaLaw(tenantId: string, data: any, userId?: string): Promise<void> {
    await this.validateSalary(tenantId, data, userId);
    this.validateContractDates(tenantId, data, userId);
  }

  private async validateSalary(tenantId: string, data: any, userId?: string): Promise<void> {
    const amount = Number(data.salaryAmount);
    const smlv = await this.legalParametersService.getValueAt('SMLV', new Date(), tenantId);

    if (amount <= 0) {
      this.logAndThrow(tenantId, 'Salary amount must be greater than 0', userId);
    }

    if (data.contractType === EmployeeContractType.PRESTACION && amount < smlv) {
      this.logAndThrow(tenantId, `PRESTACION contract must have at least 1 SMLV (${smlv})`, userId);
    }

    if (data.contractType === EmployeeContractType.APRENDIZAJE) {
      if (amount < smlv * 0.5 || amount > smlv) {
        this.logAndThrow(
          tenantId,
          `APRENDIZAJE contract must be between 0.5 and 1 SMLV (${smlv * 0.5} - ${smlv})`,
          userId,
        );
      }
    }

    if (data.salaryType === SalaryType.INTEGRAL && amount < smlv * 13) {
      this.logAndThrow(
        tenantId,
        `INTEGRAL salary type must have at least 13 SMLV (${smlv * 13})`,
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

  private async calculateTransportSubsidy(
    tenantId: string,
    salaryAmount: number,
  ): Promise<boolean> {
    const smlv = await this.legalParametersService.getValueAt('SMLV', new Date(), tenantId);
    return salaryAmount <= smlv * 2;
  }

  private async syncBeneficiaries(
    tenantId: string,
    employeeDetailsId: string,
    beneficiaries: CreateBeneficiaryDto[],
  ): Promise<void> {
    const existing = await this.socialProfileService.findAllByEmployee(tenantId, employeeDetailsId);
    for (const profile of existing) {
      await this.socialProfileService.remove(tenantId, profile.id, employeeDetailsId);
    }
    for (const b of beneficiaries) {
      await this.socialProfileService.create(tenantId, employeeDetailsId, {
        primerNombre: b.primerNombre,
        segundoNombre: b.segundoNombre,
        primerApellido: b.primerApellido,
        segundoApellido: b.segundoApellido,
        documentType: b.documentType,
        documentNumber: b.documentNumber,
        relationshipType: b.relationshipType,
        disability: b.disability,
        birthDate: new Date(b.fechaNacimiento),
        isDependent: true,
      });
    }
  }

  private logAndThrow(tenantId: string, message: string, userId?: string) {
    const context = `tenantId=${tenantId}${userId ? `, userId=${userId}` : ''}`;
    this.logger.warn(`Validation error: ${message} (${context})`);
    throw new UnprocessableEntityException(message);
  }

  private async validateAndSwapPhoto(
    tenantId: string,
    employee: EmployeeDetails & { user: User },
    newPhotoId: string | null,
  ): Promise<void> {
    if (newPhotoId !== null) {
      const storageObj = await this.storageService.findById(newPhotoId, tenantId);

      if (storageObj.domain !== StorageDomain.USERS) {
        throw new BadRequestException('El StorageObject no pertenece al dominio USERS');
      }

      if (storageObj.entityType !== null && storageObj.entityType !== 'EmployeeDetails') {
        throw new BadRequestException(
          'El StorageObject no corresponde a la entidad EmployeeDetails',
        );
      }

      if (storageObj.entityId !== null && storageObj.entityId !== employee.id) {
        throw new BadRequestException('El StorageObject no corresponde al empleado indicado');
      }
    }

    const previousPhotoId = employee.photoStorageObjectId;
    if (previousPhotoId && previousPhotoId !== newPhotoId) {
      try {
        await this.storageService.deleteFile(previousPhotoId, tenantId);
      } catch {
        this.logger.warn(
          `[PHOTO_CLEANUP] No se pudo soft-delete el StorageObject anterior id=${previousPhotoId} tenantId=${tenantId}`,
        );
      }
    }
  }

  private buildUpdatePayload(
    data: Record<string, unknown>,
    changedBy?: string,
  ): UpdateEmployeePayload {
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
      'barrio',
      'localidad',
      'costCenter',
      'laborClassification',
      'nonSalaryAmount',
      'isActive',
      'photoStorageObjectId',
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

    if (data.cedula !== undefined) {
      user.cedula = data.cedula as string;
    }
    if (data.documentType !== undefined) {
      user.documentType = data.documentType as User['documentType'];
    }
    if (data.email !== undefined) {
      user.email = data.email as string;
    }
    if (data.roleId !== undefined) {
      user.roleId = data.roleId as string;
    }

    const payload: UpdateEmployeePayload = { employee, changedBy };
    if (Object.keys(user).length > 0) {
      payload.user = user;
    }

    return payload;
  }
}
