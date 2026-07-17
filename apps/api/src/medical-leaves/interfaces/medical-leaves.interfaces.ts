import { LeaveOrigin, LeaveStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Resultado del reparto automático empleador / EPS / ARL (NOM-13 PC-1).
 *
 * **Origen COMUN**
 * - Días 1–2: empleador 100% de la base diaria.
 * - Días 3–90: EPS 66.67%.
 * - Días 91–180: EPS 50%.
 * - Día > 180: warning; no asignar a EPS en MVP.
 *
 * **Origen LABORAL**
 * - Todos los días: ARL 100%; empleador 0 días / 0 monto.
 *
 * Implementación: `medical-leave-payment.utils.ts` (task 04).
 */
export interface PaymentSplitResult {
  totalDays: number;
  employerPaidDays: number;
  epsArlPaidDays: number;
  employerAmount: Decimal;
  epsArlAmount: Decimal;
  warnings?: string[];
}

/**
 * Contrato del reparto de pago. Implementación completa en task 04 (`medical-leave-payment.utils.ts`).
 */
export function calculatePaymentSplit(
  _origin: LeaveOrigin,
  _startDate: Date,
  _endDate: Date,
  _dailySalary: Decimal,
): PaymentSplitResult {
  throw new Error('calculatePaymentSplit not implemented — see task 04');
}

export interface MedicalLeaveRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  origin: LeaveOrigin;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  employerPaidDays: number;
  epsArlPaidDays: number;
  epsArlAmount: Decimal | null;
  employerAmount: Decimal;
  supportStorageObjectId: string | null;
  status: LeaveStatus;
  radicatedAt: Date | null;
  recoveredAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MedicalLeaveSummary extends MedicalLeaveRecord {
  employeeName: string;
  locationId: string | null;
  locationName: string | null;
}

export interface MedicalLeaveRegistrationResult extends MedicalLeaveRecord {
  annualAccumulatedDays: number;
  exceeds180DayThreshold: boolean;
}

export interface CreateMedicalLeaveInput {
  employeeId: string;
  origin: LeaveOrigin;
  startDate: Date;
  endDate: Date;
}

export interface UpdateMedicalLeaveStatusInput {
  status: LeaveStatus;
  rejectionReason?: string;
}

export interface ListMedicalLeavesOptions {
  employeeId?: string;
  locationId?: string;
  status?: LeaveStatus;
  origin?: LeaveOrigin;
  /** Filtro por mes calendario (`YYYY-MM`). */
  month?: string;
  dateFrom?: Date;
  dateTo?: Date;
  cursor?: string;
  take?: number;
}

export interface CreateMedicalLeaveData {
  employeeId: string;
  origin: LeaveOrigin;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  employerPaidDays: number;
  epsArlPaidDays: number;
  epsArlAmount: Decimal | null;
  employerAmount: Decimal;
  supportStorageObjectId?: string | null;
  status?: LeaveStatus;
}

export interface UpdateMedicalLeaveData {
  status?: LeaveStatus;
  radicatedAt?: Date | null;
  recoveredAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  supportStorageObjectId?: string | null;
  totalDays?: number;
  employerPaidDays?: number;
  epsArlPaidDays?: number;
  epsArlAmount?: Decimal | null;
  employerAmount?: Decimal;
}

/** Metadatos de auditoría del rechazo de una incapacidad (NOM-13 / OS-324). */
export interface MedicalLeaveRejectionAudit {
  actorUserId: string;
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
}

/** Incapacidad activa que intersecta un período de liquidación (task 07). */
export interface MedicalLeavePayrollPeriodRange {
  id: string;
  employeeId: string;
  origin: LeaveOrigin;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  employerPaidDays: number;
  epsArlPaidDays: number;
  employerAmount: Decimal;
  epsArlAmount: Decimal | null;
}

export interface IMedicalLeavesRepository {
  findById(tenantId: string, id: string): Promise<MedicalLeaveRecord | null>;
  create(tenantId: string, data: CreateMedicalLeaveData): Promise<MedicalLeaveRecord>;
  update(tenantId: string, id: string, data: UpdateMedicalLeaveData): Promise<MedicalLeaveRecord>;
  updateWithRejectionAudit(
    tenantId: string,
    id: string,
    data: UpdateMedicalLeaveData,
    audit: MedicalLeaveRejectionAudit,
  ): Promise<MedicalLeaveRecord>;
  softDelete(tenantId: string, id: string): Promise<MedicalLeaveRecord>;
  listSummaries(
    tenantId: string,
    options: ListMedicalLeavesOptions,
  ): Promise<MedicalLeaveSummary[]>;
  sumActiveDaysInCalendarYear(tenantId: string, employeeId: string, year: number): Promise<number>;
  findOverlappingForPayrollPeriod(
    tenantId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<MedicalLeavePayrollPeriodRange[]>;
}

export interface IMedicalLeavesService {
  register(
    tenantId: string,
    actorUserId: string,
    input: CreateMedicalLeaveInput,
  ): Promise<MedicalLeaveRegistrationResult>;
  updateStatus(
    tenantId: string,
    actorUserId: string,
    id: string,
    input: UpdateMedicalLeaveStatusInput,
  ): Promise<MedicalLeaveRecord>;
  list(tenantId: string, options: ListMedicalLeavesOptions): Promise<MedicalLeaveSummary[]>;
  getById(tenantId: string, id: string): Promise<MedicalLeaveRegistrationResult>;
  softDelete(tenantId: string, actorUserId: string, id: string): Promise<MedicalLeaveRecord>;
  getAnnualAccumulatedDays(tenantId: string, employeeId: string, year: number): Promise<number>;
  getSupportDocumentUrl(tenantId: string, id: string): Promise<string>;
}
