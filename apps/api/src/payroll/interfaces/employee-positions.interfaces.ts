export interface EmployeePositionRecord {
  id: string;
  tenantId: string;
  title: string;
  area: string;
  baseSalaryRange: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeePositionHistoryRecord {
  id: string;
  tenantId: string;
  employeeDetailsId: string;
  positionId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  changedBy: string | null;
  createdAt: Date;
}

export interface CreateEmployeePositionData {
  title: string;
  area: string;
  baseSalaryRange: string;
}

export interface UpdateEmployeePositionData {
  title?: string;
  area?: string;
  baseSalaryRange?: string;
  isActive?: boolean;
}

export interface ListEmployeePositionsOptions {
  includeInactive?: boolean;
  area?: string;
  search?: string;
}

export interface IEmployeePositionsRepository {
  findAll(
    tenantId: string,
    options?: ListEmployeePositionsOptions,
  ): Promise<EmployeePositionRecord[]>;
  findById(tenantId: string, id: string): Promise<EmployeePositionRecord | null>;
  findByTitle(tenantId: string, title: string): Promise<EmployeePositionRecord | null>;
  countActiveEmployeesByPosition(tenantId: string, positionId: string): Promise<number>;
  create(tenantId: string, data: CreateEmployeePositionData): Promise<EmployeePositionRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdateEmployeePositionData,
  ): Promise<EmployeePositionRecord>;
  deactivate(tenantId: string, id: string): Promise<EmployeePositionRecord>;
  findHistoryByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeePositionHistoryRecord[]>;
  closeOpenHistory(tenantId: string, employeeDetailsId: string, effectiveTo: Date): Promise<void>;
  createHistoryEntry(data: {
    tenantId: string;
    employeeDetailsId: string;
    positionId: string;
    effectiveFrom: Date;
    changedBy?: string;
  }): Promise<EmployeePositionHistoryRecord>;
}

export interface IEmployeePositionsService {
  findAll(
    tenantId: string,
    options?: ListEmployeePositionsOptions,
  ): Promise<EmployeePositionRecord[]>;
  findById(tenantId: string, id: string): Promise<EmployeePositionRecord>;
  create(tenantId: string, data: CreateEmployeePositionData): Promise<EmployeePositionRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdateEmployeePositionData,
  ): Promise<EmployeePositionRecord>;
  deactivate(tenantId: string, id: string): Promise<EmployeePositionRecord>;
  getEmployeePositionHistory(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeePositionHistoryRecord[]>;
  assignPositionToEmployee(
    tenantId: string,
    employeeDetailsId: string,
    positionId: string,
    changedBy?: string,
  ): Promise<void>;
}
