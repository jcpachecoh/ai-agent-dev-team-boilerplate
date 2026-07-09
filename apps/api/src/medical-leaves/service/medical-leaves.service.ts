import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveStatus } from '@prisma/client';

import { AuthService } from '../../auth/service/auth.service';
import { SYSTEM_ADMIN_ROLES } from '../../common/config/rbac.config';
import { PayrollRepository } from '../../payroll/repository/payroll.repository';
import { StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import type {
  CreateMedicalLeaveInput,
  IMedicalLeavesService,
  ListMedicalLeavesOptions,
  MedicalLeaveRecord,
  MedicalLeaveRegistrationResult,
  MedicalLeaveSummary,
  UpdateMedicalLeaveStatusInput,
} from '../interfaces/medical-leaves.interfaces';
import { MedicalLeavesRepository } from '../repository/medical-leaves.repository';
import { calculatePaymentSplit, resolveDailySalary } from '../utils/medical-leave-payment.utils';

const MEDICAL_LEAVE_WRITE_ROLES = new Set<string>([...SYSTEM_ADMIN_ROLES, 'NOMINA']);
const SUPPORT_DOCUMENT_PRESIGNED_TTL_SECONDS = 900;
const SUPPORT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_SUPPORT_DOCUMENT_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export interface MedicalLeaveSupportDocumentFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const ANNUAL_DAYS_WARNING_THRESHOLD = 180;

const ALLOWED_STATUS_TRANSITIONS: Readonly<Record<LeaveStatus, readonly LeaveStatus[]>> = {
  [LeaveStatus.REGISTRADA]: [LeaveStatus.RADICADA_EPS, LeaveStatus.RECHAZADA],
  [LeaveStatus.RADICADA_EPS]: [LeaveStatus.RECOBRADA, LeaveStatus.RECHAZADA],
  [LeaveStatus.RECOBRADA]: [],
  [LeaveStatus.RECHAZADA]: [],
};

@Injectable()
export class MedicalLeavesService implements IMedicalLeavesService {
  constructor(
    private readonly medicalLeavesRepository: MedicalLeavesRepository,
    private readonly payrollRepository: PayrollRepository,
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
  ) {}

  async register(
    tenantId: string,
    actorUserId: string,
    input: CreateMedicalLeaveInput,
  ): Promise<MedicalLeaveRegistrationResult> {
    await this.assertNominaWrite(tenantId, actorUserId);

    if (input.startDate > input.endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior o igual a la fecha de fin',
      );
    }

    const employee = await this.requireEmployee(tenantId, input.employeeId);
    await this.assertNoExactDuplicate(tenantId, input);

    const dailySalary = resolveDailySalary(employee.salaryAmount);
    const split = calculatePaymentSplit(input.origin, input.startDate, input.endDate, dailySalary);

    if (split.totalDays <= 0) {
      throw new BadRequestException('El rango de fechas debe incluir al menos un día');
    }

    const record = await this.medicalLeavesRepository.create(tenantId, {
      employeeId: input.employeeId,
      origin: input.origin,
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays: split.totalDays,
      employerPaidDays: split.employerPaidDays,
      epsArlPaidDays: split.epsArlPaidDays,
      epsArlAmount: split.epsArlAmount,
      employerAmount: split.employerAmount,
      status: LeaveStatus.REGISTRADA,
    });

    const year = input.startDate.getUTCFullYear();
    const annualAccumulatedDays = await this.medicalLeavesRepository.sumActiveDaysInCalendarYear(
      tenantId,
      input.employeeId,
      year,
    );

    return {
      ...record,
      annualAccumulatedDays,
      exceeds180DayThreshold: annualAccumulatedDays >= ANNUAL_DAYS_WARNING_THRESHOLD,
    };
  }

  async updateStatus(
    tenantId: string,
    actorUserId: string,
    id: string,
    input: UpdateMedicalLeaveStatusInput,
  ): Promise<MedicalLeaveRecord> {
    await this.assertNominaWrite(tenantId, actorUserId);

    const leave = await this.requireLeave(tenantId, id);
    this.assertValidStatusTransition(leave.status, input.status);

    if (input.status === LeaveStatus.RECHAZADA && !input.rejectionReason?.trim()) {
      throw new BadRequestException('El motivo de rechazo es obligatorio');
    }

    if (input.status === LeaveStatus.RADICADA_EPS && !leave.supportStorageObjectId) {
      throw new BadRequestException(
        'Debe adjuntar el soporte médico antes de radicar ante EPS/ARL',
      );
    }

    const now = new Date();
    const updateData: Parameters<MedicalLeavesRepository['update']>[2] = {
      status: input.status,
    };

    if (input.status === LeaveStatus.RADICADA_EPS) {
      updateData.radicatedAt = now;
    } else if (input.status === LeaveStatus.RECOBRADA) {
      updateData.recoveredAt = now;
    } else if (input.status === LeaveStatus.RECHAZADA) {
      updateData.rejectedAt = now;
      updateData.rejectionReason = input.rejectionReason?.trim() ?? null;
    }

    return this.medicalLeavesRepository.update(tenantId, id, updateData);
  }

  async list(tenantId: string, options: ListMedicalLeavesOptions): Promise<MedicalLeaveSummary[]> {
    return this.medicalLeavesRepository.listSummaries(tenantId, options);
  }

  async getById(tenantId: string, id: string): Promise<MedicalLeaveRegistrationResult> {
    const leave = await this.requireLeave(tenantId, id);
    const year = leave.startDate.getUTCFullYear();
    const annualAccumulatedDays = await this.medicalLeavesRepository.sumActiveDaysInCalendarYear(
      tenantId,
      leave.employeeId,
      year,
    );

    return {
      ...leave,
      annualAccumulatedDays,
      exceeds180DayThreshold: annualAccumulatedDays >= ANNUAL_DAYS_WARNING_THRESHOLD,
    };
  }

  async softDelete(tenantId: string, actorUserId: string, id: string): Promise<MedicalLeaveRecord> {
    await this.assertNominaWrite(tenantId, actorUserId);
    await this.requireLeave(tenantId, id);
    return this.medicalLeavesRepository.softDelete(tenantId, id);
  }

  async getAnnualAccumulatedDays(
    tenantId: string,
    employeeId: string,
    year: number,
  ): Promise<number> {
    await this.requireEmployee(tenantId, employeeId);
    return this.medicalLeavesRepository.sumActiveDaysInCalendarYear(tenantId, employeeId, year);
  }

  async attachSupportDocument(
    tenantId: string,
    actorUserId: string,
    medicalLeaveId: string,
    file: MedicalLeaveSupportDocumentFile,
  ): Promise<MedicalLeaveRecord> {
    await this.assertNominaWrite(tenantId, actorUserId);
    await this.requireLeave(tenantId, medicalLeaveId);
    this.assertValidSupportDocument(file);

    const stored = await this.storageService.uploadFile({
      tenantId,
      uploadedBy: actorUserId,
      domain: StorageDomain.PAYROLL,
      entityType: 'MedicalLeave',
      entityId: medicalLeaveId,
      visibility: StorageVisibility.PRIVATE,
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
    });

    return this.medicalLeavesRepository.update(tenantId, medicalLeaveId, {
      supportStorageObjectId: stored.id,
    });
  }

  async getSupportDocumentUrl(tenantId: string, id: string): Promise<string> {
    const leave = await this.requireLeave(tenantId, id);
    if (!leave.supportStorageObjectId) {
      throw new NotFoundException('La incapacidad no tiene soporte médico adjunto');
    }

    return this.storageService.getPresignedUrl(
      leave.supportStorageObjectId,
      tenantId,
      SUPPORT_DOCUMENT_PRESIGNED_TTL_SECONDS,
    );
  }

  private assertValidSupportDocument(file: MedicalLeaveSupportDocumentFile): void {
    const normalizedMime = file.mimetype.toLowerCase();
    if (!ALLOWED_SUPPORT_DOCUMENT_MIME_TYPES.has(normalizedMime)) {
      throw new BadRequestException('Tipo de archivo no permitido. Use PDF, JPEG o PNG.');
    }

    if (file.size > SUPPORT_DOCUMENT_MAX_BYTES) {
      throw new BadRequestException('El soporte médico no puede superar 10 MB');
    }

    if (!this.matchesDeclaredMimeType(file.buffer, normalizedMime)) {
      throw new BadRequestException('El contenido del archivo no coincide con su tipo declarado');
    }
  }

  private matchesDeclaredMimeType(buffer: Buffer, mimetype: string): boolean {
    if (mimetype === 'application/pdf') {
      return buffer.subarray(0, 4).toString('ascii') === '%PDF';
    }
    if (mimetype === 'image/jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimetype === 'image/png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }
    return false;
  }

  private async assertNominaWrite(tenantId: string, actorUserId: string): Promise<void> {
    const actor = await this.authService.me(actorUserId);
    if (actor.tenantId !== tenantId) {
      throw new ForbiddenException('Acceso denegado');
    }
    if (!MEDICAL_LEAVE_WRITE_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('Solo personal de nómina puede gestionar incapacidades');
    }
  }

  private async requireEmployee(tenantId: string, employeeId: string) {
    const employee = await this.payrollRepository.findById(employeeId);
    if (!employee || employee.tenantId !== tenantId || employee.deletedAt || !employee.isActive) {
      throw new NotFoundException(`Empleado ${employeeId} no encontrado`);
    }
    return employee;
  }

  private async requireLeave(tenantId: string, id: string): Promise<MedicalLeaveRecord> {
    const leave = await this.medicalLeavesRepository.findById(tenantId, id);
    if (!leave) {
      throw new NotFoundException(`Incapacidad ${id} no encontrada`);
    }
    return leave;
  }

  private async assertNoExactDuplicate(
    tenantId: string,
    input: CreateMedicalLeaveInput,
  ): Promise<void> {
    const candidates = await this.medicalLeavesRepository.listSummaries(tenantId, {
      employeeId: input.employeeId,
      dateFrom: input.startDate,
      dateTo: input.endDate,
    });

    const duplicate = candidates.find(
      (leave) =>
        this.isSameCalendarDate(leave.startDate, input.startDate) &&
        this.isSameCalendarDate(leave.endDate, input.endDate),
    );

    if (duplicate) {
      throw new ConflictException(
        'Ya existe una incapacidad activa con las mismas fechas para este empleado',
      );
    }
  }

  private assertValidStatusTransition(current: LeaveStatus, next: LeaveStatus): void {
    const allowed = ALLOWED_STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`No se puede cambiar el estado de ${current} a ${next}`);
    }
  }

  private isSameCalendarDate(left: Date, right: Date): boolean {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }
}
