import { NovedadRequestSource, NovedadStatus, NovedadType } from '@prisma/client';

export const PAYROLL_NOVEDADES_REPOSITORY = Symbol('PAYROLL_NOVEDADES_REPOSITORY');

export interface PayrollNovedadRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  type: NovedadType;
  startDate: Date;
  endDate: Date;
  isPaid: boolean;
  linkedLeaveId: string | null;
  supportStorageObjectId: string | null;
  notes: string | null;
  requestedBy: NovedadRequestSource;
  status: NovedadStatus;
  supervisorApproverId: string | null;
  supervisorDecisionAt: Date | null;
  supervisorComment: string | null;
  rrhhApproverId: string | null;
  rrhhDecisionAt: Date | null;
  rejectionReason: string | null;
  overlapWarningAck: boolean;
  isEditable: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PayrollNovedadSummary extends PayrollNovedadRecord {
  employeeName: string;
  locationId: string | null;
  locationName: string | null;
  editBlockedReason?: string | null;
}

export interface SubmitNovedadInput {
  employeeId: string;
  type: NovedadType;
  startDate: Date;
  endDate: Date;
  isPaid?: boolean;
  notes?: string;
  supportStorageObjectId?: string;
  requestedBy: NovedadRequestSource;
  overlapWarningAck?: boolean;
  autoApprove?: boolean;
}

export interface RejectNovedadInput {
  novedadId: string;
  rejectionReason: string;
  comment?: string;
}

export interface EditNovedadInput {
  startDate?: Date;
  endDate?: Date;
  isPaid?: boolean;
  notes?: string;
  overlapWarningAck?: boolean;
}

export interface EditableNovedadSnapshot {
  startDate: string;
  endDate: string;
  isPaid: boolean;
  notes: string | null;
}

export interface NovedadAuditLogRecord {
  id: string;
  tenantId: string;
  novedadId: string;
  changedBy: string;
  changedAt: Date;
  previousValue: EditableNovedadSnapshot;
  newValue: EditableNovedadSnapshot;
  changedByName?: string | null;
}

export interface EditNovedadResult {
  novedad: PayrollNovedadRecord;
  auditLog: NovedadAuditLogRecord;
}

export interface NovedadListFilters {
  status?: NovedadStatus[];
  employeeId?: string;
  locationId?: string;
  type?: NovedadType;
  startDateFrom?: Date;
  startDateTo?: Date;
  supervisorInbox?: boolean;
  rrhhInbox?: boolean;
  employeeIds?: string[];
  cursor?: string;
  take?: number;
}

export interface OverlapCheckResult {
  hasOverlap: boolean;
  conflictingNovedadIds: string[];
}

export interface SubmitNovedadResult {
  novedad: PayrollNovedadRecord;
  warnings?: string[];
}

export interface CreatePayrollNovedadData {
  employeeId: string;
  type: NovedadType;
  startDate: Date;
  endDate: Date;
  isPaid: boolean;
  linkedLeaveId?: string | null;
  supportStorageObjectId?: string | null;
  notes?: string | null;
  requestedBy: NovedadRequestSource;
  status: NovedadStatus;
  overlapWarningAck?: boolean;
  rrhhApproverId?: string | null;
  rrhhDecisionAt?: Date | null;
}

export interface UpdatePayrollNovedadData {
  status?: NovedadStatus;
  supervisorApproverId?: string | null;
  supervisorDecisionAt?: Date | null;
  supervisorComment?: string | null;
  rrhhApproverId?: string | null;
  rrhhDecisionAt?: Date | null;
  rejectionReason?: string | null;
  supportStorageObjectId?: string | null;
  startDate?: Date;
  endDate?: Date;
  isPaid?: boolean;
  notes?: string | null;
}

export interface EmployeeApprovalContext {
  userId: string;
  /** null para empleados con costCenter = ROTANTE (CONN-06) — sin sede fija en ficha. */
  locationId: string | null;
  positionId: string | null;
}

export interface PayrollNovedadPayrollPeriodRange {
  id: string;
  employeeId: string;
  type: NovedadType;
  startDate: Date;
  endDate: Date;
  isPaid: boolean;
}

export interface PayrollNovedadSupportDocumentFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface IPayrollNovedadesRepository {
  findById(tenantId: string, id: string): Promise<PayrollNovedadRecord | null>;
  create(tenantId: string, data: CreatePayrollNovedadData): Promise<PayrollNovedadRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdatePayrollNovedadData,
  ): Promise<PayrollNovedadRecord>;
  listSummaries(tenantId: string, filters: NovedadListFilters): Promise<PayrollNovedadSummary[]>;
  findOverlapping(
    tenantId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ): Promise<OverlapCheckResult>;
  findApprovedForPeriodByEmployeeIds(
    tenantId: string,
    employeeIds: string[],
    periodStart: Date,
    periodEnd: Date,
  ): Promise<PayrollNovedadPayrollPeriodRange[]>;
  findSubordinatePositionIds(tenantId: string, supervisorPositionId: string): Promise<string[]>;
  findEmployeeApprovalContext(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeApprovalContext | null>;
  findActorUser(
    tenantId: string,
    userId: string,
  ): Promise<{ roleCode: string; positionId: string | null } | null>;
  findEmployeeIdByUserId(tenantId: string, userId: string): Promise<string | null>;
  findSupervisorCandidatesInLocation(
    tenantId: string,
    locationId: string,
  ): Promise<Array<{ id: string; positionId: string | null }>>;
  findEmployeeIdsInScope(
    tenantId: string,
    locationIds: string[],
    subordinatePositionIds: string[],
  ): Promise<string[]>;
  updateEditableFields(
    tenantId: string,
    id: string,
    data: Pick<UpdatePayrollNovedadData, 'startDate' | 'endDate' | 'isPaid' | 'notes'>,
    auditLog: {
      changedBy: string;
      previousValue: EditableNovedadSnapshot;
      newValue: EditableNovedadSnapshot;
    },
  ): Promise<PayrollNovedadRecord>;
  listAuditLogsByNovedadId(tenantId: string, novedadId: string): Promise<NovedadAuditLogRecord[]>;
  isConsumedByProcessedPayroll(
    tenantId: string,
    novedad: Pick<PayrollNovedadRecord, 'employeeId' | 'status' | 'startDate' | 'endDate'>,
  ): Promise<boolean>;
}

export interface IPayrollNovedadesService {
  submit(
    tenantId: string,
    actorUserId: string,
    input: SubmitNovedadInput,
  ): Promise<SubmitNovedadResult>;
  approveBySupervisor(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
  ): Promise<PayrollNovedadRecord>;
  rejectBySupervisor(
    tenantId: string,
    actorUserId: string,
    input: RejectNovedadInput,
  ): Promise<PayrollNovedadRecord>;
  approveByRRHH(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
  ): Promise<PayrollNovedadRecord>;
  rejectByRRHH(
    tenantId: string,
    actorUserId: string,
    input: RejectNovedadInput,
  ): Promise<PayrollNovedadRecord>;
  list(
    tenantId: string,
    actorUserId: string,
    filters: NovedadListFilters,
  ): Promise<PayrollNovedadSummary[]>;
  listMyNovedades(
    tenantId: string,
    actorUserId: string,
    filters: Omit<
      NovedadListFilters,
      'employeeId' | 'supervisorInbox' | 'rrhhInbox' | 'employeeIds'
    >,
  ): Promise<PayrollNovedadSummary[]>;
  listEmployeeTypeConfigs(tenantId: string): Promise<
    Array<{
      id: string;
      type: NovedadType;
      requiresSupervisorApproval: boolean;
      requiresSupportDocument: boolean;
      isPaidDefault: boolean;
    }>
  >;
  findOne(tenantId: string, actorUserId: string, id: string): Promise<PayrollNovedadRecord>;
  attachSupportDocument(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
    file: PayrollNovedadSupportDocumentFile,
  ): Promise<PayrollNovedadRecord>;
  getSupportDocumentUrl(tenantId: string, actorUserId: string, id: string): Promise<string>;
  edit(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
    input: EditNovedadInput,
  ): Promise<EditNovedadResult>;
  listAuditLogs(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
  ): Promise<NovedadAuditLogRecord[]>;
}
