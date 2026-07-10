import {
  OvertimeApprovalDecision,
  OvertimeApprovalLevel,
  OvertimeRequestType,
  OvertimeStatus,
} from '@prisma/client';

export const OVERTIME_REPOSITORY = Symbol('OVERTIME_REPOSITORY');

export const OVERTIME_ACCUMULATION_THRESHOLD_MINUTES = 30;

export interface OvertimeRequestRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  locationId: string;
  type: OvertimeRequestType;
  shiftEndTime: Date;
  actualEndTime: Date;
  accumulatedMinutes: number;
  status: OvertimeStatus;
  payrollPeriod: string | null;
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

export interface UpdateOvertimeRequestData {
  shiftEndTime?: Date;
  actualEndTime?: Date;
  accumulatedMinutes?: number;
  status?: OvertimeStatus;
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
  accumulatedMinutes: number;
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
  findExitLogsForPeriod(
    tenantId: string,
    employeeId: string,
    locationId: string,
    workDateFrom: Date,
    workDateTo: Date,
  ): Promise<Array<{ id: string; workDate: Date; timestamp: Date }>>;
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
}
