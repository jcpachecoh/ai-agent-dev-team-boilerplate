import {
  AttendanceEventType,
  OvertimeApprovalDecision,
  OvertimeApprovalLevel,
  OvertimeRequestType,
  OvertimeStatus,
  Prisma,
} from '@prisma/client';

export const OVERTIME_REPOSITORY = Symbol('OVERTIME_REPOSITORY');

export const OVERTIME_ACCUMULATION_THRESHOLD_MINUTES = 30;

/** Prisma interactive-transaction client (service opens `$transaction`). */
export type OvertimeTransactionClient = Prisma.TransactionClient;

export interface OvertimeRequestRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  locationId: string;
  type: OvertimeRequestType;
  /** CONN-04a detection metadata; null on SOLICITUD_ADMINISTRATIVA (OS-606). */
  shiftEndTime: Date | null;
  /** CONN-04a detection metadata; null on SOLICITUD_ADMINISTRATIVA (OS-606). */
  actualEndTime: Date | null;
  /** CONN-04a accumulated minutes; null on SOLICITUD_ADMINISTRATIVA (OS-606). */
  accumulatedMinutes: number | null;
  status: OvertimeStatus;
  payrollPeriod: string | null;
  /** OS-606 admin: work day (DATE). Null on DETECCION_AUTOMATICA. */
  workDate: Date | null;
  proposedStartTime: Date | null;
  proposedEndTime: Date | null;
  proposedMinutes: number | null;
  reasonOptionId: string | null;
  requestedByUserId: string | null;
  batchId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface OvertimeApprovalRecord {
  id: string;
  tenantId: string;
  overtimeRequestId: string;
  level: OvertimeApprovalLevel;
  approverId: string | null;
  decision: OvertimeApprovalDecision | null;
  decidedAt: Date | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OvertimeRequestSummary extends OvertimeRequestRecord {
  employeeName: string;
  locationName: string;
}

export interface OvertimeRequestDetail extends OvertimeRequestSummary {
  approvals: OvertimeApprovalRecord[];
}

export interface ExitRegisteredPayload {
  tenantId: string;
  employeeId: string;
  locationId: string;
  workDate: Date;
  actualEndTime: Date;
}

export interface OvertimeInboxFilters {
  status?: OvertimeStatus[];
  payrollPeriod?: string;
  locationId?: string;
  employeeId?: string;
  cursor?: string;
  take?: number;
}

export interface ApproveOvertimeInput {
  overtimeRequestId: string;
  comment?: string;
}

export interface ObjectOvertimeInput {
  overtimeRequestId: string;
  comment: string;
}

export interface OvertimeInboxPage {
  items: OvertimeRequestSummary[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface OvertimePeriodSummary {
  payrollPeriod: string;
  pendingCount: number;
  approvedCount: number;
  objectedCount: number;
}

export interface CreateOvertimeRequestData {
  employeeId: string;
  locationId: string;
  type: OvertimeRequestType;
  shiftEndTime: Date;
  actualEndTime: Date;
  accumulatedMinutes: number;
  status: OvertimeStatus;
  payrollPeriod: string;
}

/** Persist-ready admin row (service validates; repository does not compute minutes/authz). */
export interface CreateAdministrativeOvertimeRequestData {
  employeeId: string;
  locationId: string;
  payrollPeriod: string;
  workDate: Date;
  proposedStartTime: Date;
  proposedEndTime: Date;
  proposedMinutes: number;
  reasonOptionId: string;
  requestedByUserId: string;
  batchId: string;
  type: typeof OvertimeRequestType.SOLICITUD_ADMINISTRATIVA;
  status: typeof OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES;
}

export interface UpdateOvertimeRequestData {
  shiftEndTime?: Date;
  actualEndTime?: Date;
  accumulatedMinutes?: number;
  status?: OvertimeStatus;
}

export interface FindOverlappingAdministrativeWindowsInput {
  employeeId: string;
  locationId: string;
  proposedStartTime: Date;
  proposedEndTime: Date;
  /** Optional: ignore a row when re-checking after soft update (future). */
  excludeRequestId?: string;
}

/**
 * Service-level create input (OS-606). Client must not send minutes/period/batch/type/status —
 * those are derived in backend. `requestedByUserId` is set from the authenticated actor.
 */
export interface CreateAdministrativeOvertimeBatchInput {
  employeeIds: string[];
  locationId: string;
  workDate: Date;
  proposedStartTime: Date;
  proposedEndTime: Date;
  reasonOptionId: string;
}

export interface AdministrativeOvertimeBatchResult {
  batchId: string;
  items: OvertimeRequestRecord[];
}

export interface OvertimeEmployeeLocationCheck {
  id: string;
  locationId: string | null;
  isActive: boolean;
}

export interface UpsertOvertimeApprovalData {
  approverId?: string | null;
  decision?: OvertimeApprovalDecision | null;
  decidedAt?: Date | null;
  comment?: string | null;
}

export interface OvertimeActorContext {
  userId: string;
  roleCode: string;
  positionId: string | null;
  locationIds: string[];
}

export interface EmployeeOvertimeApprovalStatus {
  employeeId: string;
  status: OvertimeStatus | null;
  /** Null when the row has no detection minutes (e.g. incomplete/admin shape). */
  accumulatedMinutes: number | null;
}

/** OS-606 Task-08 — approved admin windows for NOM-07 intersection (bulk). */
export interface ApprovedAdministrativeOvertimeWindow {
  employeeId: string;
  locationId: string;
  workDate: Date | null;
  proposedStartTime: Date;
  proposedEndTime: Date;
  proposedMinutes: number | null;
}

export interface IOvertimeRepository {
  findById(tenantId: string, id: string): Promise<OvertimeRequestDetail | null>;
  findActiveAutomaticByPeriod(
    tenantId: string,
    employeeId: string,
    locationId: string,
    payrollPeriod: string,
  ): Promise<OvertimeRequestRecord | null>;
  createRequest(tenantId: string, data: CreateOvertimeRequestData): Promise<OvertimeRequestRecord>;
  /**
   * Create one SOLICITUD_ADMINISTRATIVA row. When `tx` is provided, uses that client
   * (service-owned `$transaction`); otherwise uses the default Prisma client.
   */
  createAdministrativeRequest(
    tenantId: string,
    data: CreateAdministrativeOvertimeRequestData,
    tx?: OvertimeTransactionClient,
  ): Promise<OvertimeRequestRecord>;
  /**
   * Create N admin rows with the same transaction client (all-or-nothing owned by service).
   * Does not open its own `$transaction`.
   */
  createAdministrativeRequests(
    tenantId: string,
    rows: CreateAdministrativeOvertimeRequestData[],
    tx: OvertimeTransactionClient,
  ): Promise<OvertimeRequestRecord[]>;
  /** Non-deleted admin requests for employee/location/workDate (any status except soft-deleted). */
  findAdministrativeByEmployeeWorkDate(
    tenantId: string,
    employeeId: string,
    locationId: string,
    workDate: Date,
  ): Promise<OvertimeRequestRecord[]>;
  /**
   * Admin windows that overlap `[proposedStartTime, proposedEndTime]` (half-open via
   * start < otherEnd && end > otherStart). Excludes soft-deleted and OBJETADA.
   */
  findOverlappingAdministrativeWindows(
    tenantId: string,
    input: FindOverlappingAdministrativeWindowsInput,
    tx?: OvertimeTransactionClient,
  ): Promise<OvertimeRequestRecord[]>;
  findByBatchId(tenantId: string, batchId: string): Promise<OvertimeRequestRecord[]>;
  findActiveLocationById(tenantId: string, locationId: string): Promise<{ id: string } | null>;
  findActiveEmployeesByIds(
    tenantId: string,
    employeeIds: string[],
  ): Promise<OvertimeEmployeeLocationCheck[]>;
  updateRequest(
    tenantId: string,
    id: string,
    data: UpdateOvertimeRequestData,
  ): Promise<OvertimeRequestRecord | null>;
  incrementAccumulatedMinutes(
    tenantId: string,
    id: string,
    delta: number,
    actualEndTime: Date,
    shiftEndTime: Date,
  ): Promise<OvertimeRequestRecord | null>;
  listInbox(tenantId: string, filters: OvertimeInboxFilters): Promise<OvertimeInboxPage>;
  findApprovalsByRequestId(
    tenantId: string,
    overtimeRequestId: string,
  ): Promise<OvertimeApprovalRecord[]>;
  upsertApproval(
    tenantId: string,
    overtimeRequestId: string,
    level: OvertimeApprovalLevel,
    data: UpsertOvertimeApprovalData,
  ): Promise<OvertimeApprovalRecord>;
  findOvertimeScopeLogsForPeriod(
    tenantId: string,
    employeeId: string,
    locationId: string,
    workDateFrom: Date,
    workDateTo: Date,
  ): Promise<
    Array<{ id: string; workDate: Date; eventType: AttendanceEventType; timestamp: Date }>
  >;
  findActorContext(tenantId: string, userId: string): Promise<OvertimeActorContext | null>;
  findApproverUserIdsByPosition(
    tenantId: string,
    positionIds: readonly string[],
    locationId?: string,
  ): Promise<string[]>;
  countByStatusForPeriod(
    tenantId: string,
    payrollPeriod: string,
    statuses: OvertimeStatus[],
  ): Promise<number>;
  findApprovalStatusByEmployeeIdsForPeriod(
    tenantId: string,
    employeeIds: string[],
    payrollPeriod: string,
  ): Promise<EmployeeOvertimeApprovalStatus[]>;
  /**
   * SOLICITUD_ADMINISTRATIVA + APROBADA for period (tenant-scoped bulk).
   * Incomplete rows (missing proposed start/end) are omitted by the repository.
   */
  findApprovedAdministrativeWindowsByEmployeeIdsForPeriod(
    tenantId: string,
    employeeIds: string[],
    payrollPeriod: string,
  ): Promise<ApprovedAdministrativeOvertimeWindow[]>;
}

export interface IOvertimeDetectionService {
  onExitRegistered(payload: ExitRegisteredPayload): Promise<void>;
}

export interface IOvertimeApprovalService {
  approve(
    tenantId: string,
    actorUserId: string,
    input: ApproveOvertimeInput,
  ): Promise<OvertimeRequestDetail>;
  object(
    tenantId: string,
    actorUserId: string,
    input: ObjectOvertimeInput,
  ): Promise<OvertimeRequestDetail>;
  listInbox(
    tenantId: string,
    actorUserId: string,
    filters: OvertimeInboxFilters,
  ): Promise<OvertimeInboxPage>;
}

export interface IOvertimeService {
  getById(tenantId: string, actorUserId: string, id: string): Promise<OvertimeRequestDetail>;
  listInbox(
    tenantId: string,
    actorUserId: string,
    filters: OvertimeInboxFilters,
  ): Promise<OvertimeInboxPage>;
  approve(
    tenantId: string,
    actorUserId: string,
    input: ApproveOvertimeInput,
  ): Promise<OvertimeRequestDetail>;
  object(
    tenantId: string,
    actorUserId: string,
    input: ObjectOvertimeInput,
  ): Promise<OvertimeRequestDetail>;
  getPeriodSummary(tenantId: string, payrollPeriod: string): Promise<OvertimePeriodSummary>;
  createAdministrativeBatch(
    tenantId: string,
    actorUserId: string,
    input: CreateAdministrativeOvertimeBatchInput,
  ): Promise<AdministrativeOvertimeBatchResult>;
}
