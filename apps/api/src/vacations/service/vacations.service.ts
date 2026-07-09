import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { VacationStatus, VacationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import type {
  ApprovedVacationRange,
  IVacationLetterService,
  IVacationsService,
  ListVacationRequestsOptions,
  RejectVacationInput,
  RequestVacationInput,
  VacationBalanceRecord,
  VacationRequestRecord,
  VacationRequestSummary,
} from '../interfaces/vacations.interfaces';
import {
  MAX_COMPENSATION_RATIO,
  VACATION_LETTER_SERVICE,
} from '../interfaces/vacations.interfaces';
import { VacationsRepository } from '../repository/vacations.repository';
import { VacationAccrualService } from './vacation-accrual.service';
import { getAccrualThroughMonth, startOfMonth } from '../utils/vacation-accrual.utils';
import { isEmployeeEligibleForVacations } from '../utils/vacation-eligibility.utils';

const LEVEL1_APPROVER_ROLES = new Set(['SUPERVISOR', 'MANAGER']);
const LEVEL2_APPROVER_ROLES = new Set(['NOMINA']);
const REQUEST_ON_BEHALF_ROLES = new Set(['NOMINA', 'OWNER', 'SUPER_ADMIN']);
const VACATION_VIEW_ROLES = new Set(['NOMINA', 'OWNER', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGER']);

/**
 * MVP (Q5): días calendario inclusivos entre startDate y endDate.
 * No excluye festivos ni domingos hasta definir calendario de días hábiles por sede.
 */
function calculateInclusiveCalendarDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  if (start > end) {
    return 0;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
}

@Injectable()
export class VacationsService implements IVacationsService {
  constructor(
    private readonly repository: VacationsRepository,
    private readonly userLocationsService: UserLocationsService,
    private readonly vacationAccrualService: VacationAccrualService,
    @Optional()
    @Inject(VACATION_LETTER_SERVICE)
    private readonly letterService?: IVacationLetterService,
  ) {}

  async getBalance(tenantId: string, employeeId: string): Promise<VacationBalanceRecord> {
    const profile = await this.repository.findEmployeeVacationProfile(tenantId, employeeId);
    if (!profile) {
      throw new NotFoundException(`Empleado ${employeeId} no encontrado`);
    }

    if (!isEmployeeEligibleForVacations(profile.contractType)) {
      return this.resolveIneligibleEmployeeBalance(tenantId, employeeId);
    }

    let balance = await this.repository.findBalanceByEmployee(tenantId, employeeId);
    const referenceDate = new Date();

    if (!balance || this.isBalanceStale(balance.lastAccrualDate, referenceDate)) {
      const synced = await this.vacationAccrualService.syncEmployeeBalance(
        tenantId,
        employeeId,
        profile.hireDate,
        referenceDate,
      );
      balance = synced.balance;
    }

    return balance;
  }

  async requestVacation(
    tenantId: string,
    actorUserId: string,
    input: RequestVacationInput,
  ): Promise<VacationRequestRecord> {
    await this.assertCanRequestForEmployee(tenantId, actorUserId, input.employeeId);
    await this.assertEmployeeCanRequestVacations(tenantId, input.employeeId);

    if (input.startDate > input.endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior o igual a la fecha de fin',
      );
    }

    const daysRequested = calculateInclusiveCalendarDays(input.startDate, input.endDate);
    if (daysRequested <= 0) {
      throw new BadRequestException('El rango de fechas debe incluir al menos un día');
    }

    return this.repository.createRequest(tenantId, {
      employeeId: input.employeeId,
      startDate: input.startDate,
      endDate: input.endDate,
      daysRequested,
      type: input.type,
    });
  }

  async approveLevel1(
    tenantId: string,
    actorUserId: string,
    requestId: string,
  ): Promise<VacationRequestRecord> {
    const request = await this.requireRequest(tenantId, requestId);
    if (request.status !== VacationStatus.SOLICITADA) {
      throw new BadRequestException(
        'Solo se puede aprobar en nivel 1 una solicitud en estado SOLICITADA',
      );
    }

    await this.assertSupervisorCanApproveLevel1(tenantId, actorUserId, request.employeeId);

    return this.repository.updateRequest(tenantId, requestId, {
      status: VacationStatus.APROBADA_NIVEL_1,
      level1ApprovedBy: actorUserId,
      level1ActedAt: new Date(),
    });
  }

  async approveLevel2(
    tenantId: string,
    actorUserId: string,
    requestId: string,
  ): Promise<VacationRequestRecord> {
    const request = await this.requireRequest(tenantId, requestId);
    if (request.status !== VacationStatus.APROBADA_NIVEL_1) {
      throw new BadRequestException(
        'Solo se puede aprobar en nivel 2 una solicitud en estado APROBADA_NIVEL_1',
      );
    }

    await this.assertCanApproveLevel2(tenantId, actorUserId);
    await this.assertSufficientBalanceForApproval(tenantId, request);
    await this.generateLetterIfAvailable(tenantId, request, 'APPROVAL');

    const updated = await this.repository.updateRequest(tenantId, requestId, {
      status: VacationStatus.APROBADA,
      level2ApprovedBy: actorUserId,
      level2ActedAt: new Date(),
    });

    await this.applyApprovedBalanceDelta(tenantId, request);

    return (await this.repository.findRequestById(tenantId, requestId)) ?? updated;
  }

  async reject(
    tenantId: string,
    actorUserId: string,
    input: RejectVacationInput,
  ): Promise<VacationRequestRecord> {
    if (!input.rejectionReason?.trim()) {
      throw new BadRequestException('El motivo de rechazo es obligatorio');
    }

    const request = await this.requireRequest(tenantId, input.requestId);

    if (request.status === VacationStatus.SOLICITADA) {
      await this.assertSupervisorCanApproveLevel1(tenantId, actorUserId, request.employeeId);
    } else if (request.status === VacationStatus.APROBADA_NIVEL_1) {
      await this.assertCanApproveLevel2(tenantId, actorUserId);
    } else {
      throw new BadRequestException('La solicitud no puede rechazarse en su estado actual');
    }

    await this.generateLetterIfAvailable(
      tenantId,
      request,
      'REJECTION',
      input.rejectionReason.trim(),
    );

    const updated = await this.repository.updateRequest(tenantId, input.requestId, {
      status: VacationStatus.RECHAZADA,
      rejectionReason: input.rejectionReason.trim(),
    });

    return (await this.repository.findRequestById(tenantId, input.requestId)) ?? updated;
  }

  async listRequests(
    tenantId: string,
    options: ListVacationRequestsOptions,
  ): Promise<VacationRequestSummary[]> {
    return this.repository.listRequestSummaries(tenantId, options);
  }

  async getMyBalance(tenantId: string, actorUserId: string): Promise<VacationBalanceRecord> {
    const employeeId = await this.requireEmployeeIdForUser(tenantId, actorUserId);
    return this.getBalance(tenantId, employeeId);
  }

  async listMyRequests(
    tenantId: string,
    actorUserId: string,
    options: Omit<ListVacationRequestsOptions, 'employeeId'>,
  ): Promise<VacationRequestSummary[]> {
    const employeeId = await this.requireEmployeeIdForUser(tenantId, actorUserId);
    return this.listRequests(tenantId, { ...options, employeeId });
  }

  async getApprovedDisfruteRanges(
    tenantId: string,
    employeeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ApprovedVacationRange[]> {
    return this.repository.findApprovedDisfruteRanges(tenantId, employeeId, dateFrom, dateTo);
  }

  async findApprovedDisfruteByDate(
    tenantId: string,
    employeeId: string,
    date: Date,
  ): Promise<ApprovedVacationRange | null> {
    return this.repository.findApprovedDisfruteByDate(tenantId, employeeId, date);
  }

  async assertCanViewEmployee(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
  ): Promise<void> {
    const actorEmployeeId = await this.repository.findEmployeeIdByUserId(tenantId, actorUserId);
    if (actorEmployeeId === employeeId) {
      return;
    }

    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (actor && VACATION_VIEW_ROLES.has(actor.roleCode)) {
      return;
    }

    throw new ForbiddenException('No puede consultar vacaciones de otro empleado');
  }

  async getRequestForActor(
    tenantId: string,
    actorUserId: string,
    requestId: string,
  ): Promise<VacationRequestRecord> {
    const request = await this.requireRequest(tenantId, requestId);
    await this.assertCanViewEmployee(tenantId, actorUserId, request.employeeId);
    return request;
  }

  async getLetterUrl(tenantId: string, actorUserId: string, requestId: string): Promise<string> {
    await this.getRequestForActor(tenantId, actorUserId, requestId);
    if (!this.letterService) {
      throw new NotFoundException(`La solicitud ${requestId} no tiene carta PDF generada`);
    }
    return this.letterService.getLetterPresignedUrl(tenantId, requestId);
  }

  async assertSupervisorCanApproveLevel1(
    tenantId: string,
    actorUserId: string,
    requestEmployeeId: string,
  ): Promise<void> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor || !LEVEL1_APPROVER_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('No tiene permiso para aprobar vacaciones en nivel 1');
    }

    const requestEmployee = await this.repository.findEmployeeApprovalContext(
      tenantId,
      requestEmployeeId,
    );
    if (!requestEmployee) {
      throw new NotFoundException(`Empleado ${requestEmployeeId} no encontrado`);
    }

    const actorLocations = await this.userLocationsService.getActiveUserLocations(
      tenantId,
      actorUserId,
    );
    const sharesLocation = actorLocations.some(
      (location) => location.id === requestEmployee.locationId,
    );
    if (!sharesLocation) {
      throw new ForbiddenException('No puede aprobar solicitudes de empleados de otra sede');
    }

    if (!actor.positionId || !requestEmployee.positionId) {
      return;
    }

    const subordinatePositionIds = await this.repository.findSubordinatePositionIds(
      tenantId,
      actor.positionId,
    );
    if (subordinatePositionIds.length === 0) {
      return;
    }

    if (!subordinatePositionIds.includes(requestEmployee.positionId)) {
      throw new ForbiddenException(
        'No puede aprobar solicitudes de empleados fuera de su jerarquía de cargo',
      );
    }
  }

  private async assertEmployeeCanRequestVacations(
    tenantId: string,
    employeeId: string,
  ): Promise<void> {
    const profile = await this.repository.findEmployeeVacationProfile(tenantId, employeeId);
    if (!profile) {
      throw new NotFoundException(`Empleado ${employeeId} no encontrado`);
    }

    if (!isEmployeeEligibleForVacations(profile.contractType)) {
      throw new BadRequestException(
        'Los colaboradores con contrato por prestación de servicios no pueden solicitar vacaciones',
      );
    }
  }

  private async resolveIneligibleEmployeeBalance(
    tenantId: string,
    employeeId: string,
  ): Promise<VacationBalanceRecord> {
    const existing = await this.repository.findBalanceByEmployee(tenantId, employeeId);
    if (existing) {
      return existing;
    }

    return this.repository.upsertBalance(tenantId, employeeId, {
      accruedDays: new Decimal(0),
      takenDays: new Decimal(0),
      compensatedDays: new Decimal(0),
      lastAccrualDate: new Date(0),
    });
  }

  private async assertCanApproveLevel2(tenantId: string, actorUserId: string): Promise<void> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor || !LEVEL2_APPROVER_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('No tiene permiso para aprobar vacaciones en nivel 2');
    }
  }

  private async assertCanRequestForEmployee(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
  ): Promise<void> {
    const actorEmployeeId = await this.repository.findEmployeeIdByUserId(tenantId, actorUserId);
    if (actorEmployeeId === employeeId) {
      return;
    }

    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (actor && REQUEST_ON_BEHALF_ROLES.has(actor.roleCode)) {
      return;
    }

    throw new ForbiddenException('No puede solicitar vacaciones para otro empleado');
  }

  private async assertSufficientBalanceForApproval(
    tenantId: string,
    request: VacationRequestRecord,
  ): Promise<void> {
    const balance = await this.getBalance(tenantId, request.employeeId);
    const available = balance.accruedDays.minus(balance.takenDays).minus(balance.compensatedDays);

    if (request.daysRequested.greaterThan(available)) {
      throw new ConflictException('La solicitud excede el saldo disponible de vacaciones');
    }

    if (request.type === VacationType.COMPENSACION) {
      const maxCompensation = balance.accruedDays.mul(MAX_COMPENSATION_RATIO);
      const projectedCompensation = balance.compensatedDays.plus(request.daysRequested);
      if (projectedCompensation.greaterThan(maxCompensation)) {
        throw new ConflictException(
          'La compensación en dinero no puede superar el 50% del derecho total',
        );
      }
    }
  }

  private async applyApprovedBalanceDelta(
    tenantId: string,
    request: VacationRequestRecord,
  ): Promise<void> {
    const balance = await this.getBalance(tenantId, request.employeeId);

    if (request.type === VacationType.DISFRUTE) {
      await this.repository.upsertBalance(tenantId, request.employeeId, {
        takenDays: balance.takenDays.plus(request.daysRequested),
      });
      return;
    }

    await this.repository.upsertBalance(tenantId, request.employeeId, {
      compensatedDays: balance.compensatedDays.plus(request.daysRequested),
    });
  }

  private async generateLetterIfAvailable(
    tenantId: string,
    request: VacationRequestRecord,
    variant: 'APPROVAL' | 'REJECTION',
    rejectionReason?: string,
  ): Promise<void> {
    if (!this.letterService) {
      return;
    }

    await this.letterService.generateAndStoreLetter(tenantId, request, variant, {
      rejectionReason,
    });
  }

  private async requireRequest(
    tenantId: string,
    requestId: string,
  ): Promise<VacationRequestRecord> {
    const request = await this.repository.findRequestById(tenantId, requestId);
    if (!request) {
      throw new NotFoundException(`Solicitud de vacaciones ${requestId} no encontrada`);
    }
    return request;
  }

  private async requireEmployeeIdForUser(tenantId: string, userId: string): Promise<string> {
    const employeeId = await this.repository.findEmployeeIdByUserId(tenantId, userId);
    if (!employeeId) {
      throw new NotFoundException('No tiene un registro de empleado vinculado a su usuario');
    }
    return employeeId;
  }

  private isBalanceStale(lastAccrualDate: Date, referenceDate: Date): boolean {
    if (lastAccrualDate.getTime() === 0) {
      return true;
    }

    return (
      startOfMonth(lastAccrualDate).getTime() < getAccrualThroughMonth(referenceDate).getTime()
    );
  }
}
