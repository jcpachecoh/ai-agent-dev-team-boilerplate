import type { VacationStatus, VacationType } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

/** Días de vacaciones acreditados por mes calendario completo (CST Art. 186). */
export const MONTHLY_ACCRUAL_DAYS = 1.25;

/** Máxima proporción del derecho total compensable en dinero (50%). */
export const MAX_COMPENSATION_RATIO = 0.5;

export interface VacationBalanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  accruedDays: Decimal;
  takenDays: Decimal;
  compensatedDays: Decimal;
  lastAccrualDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VacationRequestRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  daysRequested: Decimal;
  type: VacationType;
  status: VacationStatus;
  level1ApprovedBy: string | null;
  level1ActedAt: Date | null;
  level2ApprovedBy: string | null;
  level2ActedAt: Date | null;
  rejectionReason: string | null;
  letterStorageObjectId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VacationRequestSummary extends VacationRequestRecord {
  employeeName: string;
  locationId: string | null;
  locationName: string | null;
}

/** Rango aprobado consumido por asistencia (PC-1 / D6). */
export interface ApprovedVacationRange {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  type: VacationType;
}

export interface RequestVacationInput {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  type: VacationType;
}

export interface ApproveVacationInput {
  requestId: string;
}

export interface RejectVacationInput {
  requestId: string;
  rejectionReason: string;
}

export interface ListVacationRequestsOptions {
  employeeId?: string;
  locationId?: string;
  status?: VacationStatus;
  dateFrom?: Date;
  dateTo?: Date;
  cursor?: string;
  take?: number;
}

export interface CreateVacationRequestData {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  daysRequested: Decimal | number;
  type: VacationType;
}

export interface UpdateVacationRequestData {
  status?: VacationStatus;
  level1ApprovedBy?: string | null;
  level1ActedAt?: Date | null;
  level2ApprovedBy?: string | null;
  level2ActedAt?: Date | null;
  rejectionReason?: string | null;
  letterStorageObjectId?: string | null;
  isActive?: boolean;
}

/** Contexto mínimo del solicitante para validación de aprobación L1 (D9). */
export interface EmployeeApprovalContext {
  userId: string;
  locationId: string;
  positionId: string | null;
}

/** Empleado activo elegible para acumulación mensual (D3). */
export interface AccrualEmployeeRecord {
  id: string;
  hireDate: Date;
}

/** Perfil mínimo del empleado para vacaciones (acumulación y elegibilidad). */
export interface EmployeeVacationProfile {
  hireDate: Date;
  contractType: import('@prisma/client').EmployeeContractType;
}

export interface IVacationsRepository {
  findBalanceByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<VacationBalanceRecord | null>;
  upsertBalance(
    tenantId: string,
    employeeId: string,
    data: Partial<
      Pick<
        VacationBalanceRecord,
        'accruedDays' | 'takenDays' | 'compensatedDays' | 'lastAccrualDate'
      >
    >,
  ): Promise<VacationBalanceRecord>;
  /**
   * OS-591 (fase 1, cierre de hallazgos) — suma de días DISFRUTE/COMPENSACION de
   * solicitudes APROBADA cuya aprobación de nivel 2 (`level2ActedAt`, el momento en que
   * `applyApprovedBalanceDelta` efectivamente descontó el saldo) ocurrió en o antes de
   * `asOfDate`. Es la fuente correcta para "saldo tomado/compensado a una fecha pasada" —
   * `VacationBalance.takenDays/compensatedDays` es un contador SIEMPRE-actual y no debe
   * usarse para reconstruir un estado histórico (incluiría movimientos posteriores a
   * `asOfDate` si el balance se sincronizó después). Ver VacationsService.calculateBalanceAsOf.
   */
  sumApprovedMovementsUpTo(
    tenantId: string,
    employeeId: string,
    asOfDate: Date,
  ): Promise<{ takenDays: Decimal; compensatedDays: Decimal }>;
  createRequest(tenantId: string, data: CreateVacationRequestData): Promise<VacationRequestRecord>;
  findRequestById(tenantId: string, id: string): Promise<VacationRequestRecord | null>;
  updateRequest(
    tenantId: string,
    id: string,
    data: UpdateVacationRequestData,
  ): Promise<VacationRequestRecord>;
  listRequests(
    tenantId: string,
    options: ListVacationRequestsOptions,
  ): Promise<VacationRequestRecord[]>;
  listRequestSummaries(
    tenantId: string,
    options: ListVacationRequestsOptions,
  ): Promise<VacationRequestSummary[]>;
  findApprovedDisfruteRanges(
    tenantId: string,
    employeeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ApprovedVacationRange[]>;
  findApprovedDisfruteByDate(
    tenantId: string,
    employeeId: string,
    date: Date,
  ): Promise<ApprovedVacationRange | null>;
  findSubordinatePositionIds(tenantId: string, supervisorPositionId: string): Promise<string[]>;
  findEmployeeApprovalContext(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeApprovalContext | null>;
  findActiveEmployeesForAccrual(tenantId: string): Promise<AccrualEmployeeRecord[]>;
  findActorUser(
    tenantId: string,
    userId: string,
  ): Promise<{ roleCode: string; positionId: string | null } | null>;
  findEmployeeIdByUserId(tenantId: string, userId: string): Promise<string | null>;
  findEmployeeVacationProfile(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeVacationProfile | null>;
}

export interface IVacationLetterService {
  generateAndStoreLetter(
    tenantId: string,
    request: VacationRequestRecord,
    variant: 'APPROVAL' | 'REJECTION',
    options?: { rejectionReason?: string },
  ): Promise<{ storageObjectId: string }>;
  getLetterPresignedUrl(tenantId: string, requestId: string): Promise<string>;
}

export const VACATION_LETTER_SERVICE = Symbol('VACATION_LETTER_SERVICE');

/**
 * OS-591 (fase 1) — resultado de `calculateBalanceAsOf`: PURA previsualización, no persiste
 * nada y NO aplica `MAX_COMPENSATION_RATIO` (ese tope solo rige la compensación en dinero
 * durante la relación laboral vigente, no el saldo a liquidar en un retiro).
 */
export type VacationBalanceAsOf = {
  asOfDate: Date;
  accruedDays: Decimal;
  takenDays: Decimal;
  compensatedDays: Decimal;
  pendingDays: Decimal;
};

export interface IVacationsService {
  getBalance(tenantId: string, employeeId: string): Promise<VacationBalanceRecord>;
  /**
   * OS-591 (fase 1) — saldo de vacaciones a una fecha arbitraria (p.ej. fecha de retiro),
   * sin escribir en la base de datos y sin el tope de compensación del 50%. Entrega solo
   * días (no valor monetario — la conversión a dinero requiere el salario vigente en esa
   * fecha, que vive en el módulo payroll; ver tasks/OS-591.md).
   */
  calculateBalanceAsOf(
    tenantId: string,
    employeeId: string,
    asOfDate: Date,
  ): Promise<VacationBalanceAsOf>;
  requestVacation(
    tenantId: string,
    actorUserId: string,
    input: RequestVacationInput,
  ): Promise<VacationRequestRecord>;
  approveLevel1(
    tenantId: string,
    actorUserId: string,
    requestId: string,
  ): Promise<VacationRequestRecord>;
  approveLevel2(
    tenantId: string,
    actorUserId: string,
    requestId: string,
  ): Promise<VacationRequestRecord>;
  reject(
    tenantId: string,
    actorUserId: string,
    input: RejectVacationInput,
  ): Promise<VacationRequestRecord>;
  listRequests(
    tenantId: string,
    options: ListVacationRequestsOptions,
  ): Promise<VacationRequestSummary[]>;
  getMyBalance(tenantId: string, actorUserId: string): Promise<VacationBalanceRecord>;
  listMyRequests(
    tenantId: string,
    actorUserId: string,
    options: Omit<ListVacationRequestsOptions, 'employeeId'>,
  ): Promise<VacationRequestSummary[]>;
  getApprovedDisfruteRanges(
    tenantId: string,
    employeeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ApprovedVacationRange[]>;
  findApprovedDisfruteByDate(
    tenantId: string,
    employeeId: string,
    date: Date,
  ): Promise<ApprovedVacationRange | null>;
  assertCanViewEmployee(tenantId: string, actorUserId: string, employeeId: string): Promise<void>;
  getRequestForActor(
    tenantId: string,
    actorUserId: string,
    requestId: string,
  ): Promise<VacationRequestRecord>;
  getLetterUrl(tenantId: string, actorUserId: string, requestId: string): Promise<string>;
}

export interface IVacationAccrualService {
  accrueForTenant(tenantId: string): Promise<void>;
  syncEmployeeBalance(
    tenantId: string,
    employeeId: string,
    hireDate: Date,
  ): Promise<VacationBalanceRecord>;
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function calendarDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function inclusiveCalendarDays(from: Date, to: Date): number {
  const startMs = startOfDay(from).getTime();
  const endMs = startOfDay(to).getTime();
  if (startMs > endMs) {
    return 0;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((endMs - startMs) / dayMs) + 1;
}

/**
 * Días a acreditar en un mes calendario, prorrateados por hireDate (D3).
 *
 * @param hireDate — fecha de ingreso (EmployeeDetails.hireDate)
 * @param accrualMonth — cualquier fecha dentro del mes calendario a acreditar
 * @returns días a acreditar (2 decimales, half-up); 0 si hireDate es posterior al mes
 */
export function calculateMonthlyAccrual(hireDate: Date, accrualMonth: Date): number {
  const year = accrualMonth.getFullYear();
  const monthIndex = accrualMonth.getMonth();
  const daysInMonth = calendarDaysInMonth(year, monthIndex);
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex, daysInMonth);

  const hireDay = startOfDay(hireDate);
  const workStart = hireDay > firstDayOfMonth ? hireDay : firstDayOfMonth;
  const workEnd = lastDayOfMonth;

  const daysWorked = inclusiveCalendarDays(workStart, workEnd);
  if (daysWorked <= 0) {
    return 0;
  }

  const raw = MONTHLY_ACCRUAL_DAYS * (daysWorked / daysInMonth);
  return Math.round(raw * 100) / 100;
}
