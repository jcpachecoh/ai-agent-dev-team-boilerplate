export interface EmployeePositionSupervisorSummary {
  id: string;
  title: string;
}

export interface EmployeePositionRecord {
  id: string;
  tenantId: string;
  title: string;
  area: string;
  baseSalaryRange: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** OS-633 — cargos supervisores directos (`EmployeePositionSupervisor`), fuente de verdad de la jerarquía. */
  supervisors: EmployeePositionSupervisorSummary[];
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
  /** OS-633 — cargos supervisores asignados en la creación. `undefined`/vacío = sin supervisores. */
  supervisorPositionIds?: string[];
}

export interface UpdateEmployeePositionData {
  title?: string;
  area?: string;
  baseSalaryRange?: string;
  isActive?: boolean;
  /**
   * OS-633 — reemplaza la lista completa de supervisores del cargo.
   * `undefined` = no tocar la relación existente. `[]` = limpiar todos los supervisores.
   */
  supervisorPositionIds?: string[];
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
  /** OS-633 — resuelve cargos por id, filtrados por tenant (usado para validar supervisores). */
  findByIds(tenantId: string, ids: string[]): Promise<EmployeePositionRecord[]>;
  countActiveEmployeesByPosition(tenantId: string, positionId: string): Promise<number>;
  create(tenantId: string, data: CreateEmployeePositionData): Promise<EmployeePositionRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdateEmployeePositionData,
  ): Promise<EmployeePositionRecord>;
  deactivate(tenantId: string, id: string): Promise<EmployeePositionRecord>;
  /** OS-633 — cargos supervisores directos por cada `positionId`, agrupados. */
  findSupervisorsByPositionIds(
    tenantId: string,
    positionIds: string[],
  ): Promise<Map<string, EmployeePositionSupervisorSummary[]>>;
  /** OS-633 — subordinados transitivos de `positionId` (mismo BFS que OS-550), para detectar ciclos. */
  findSubordinatePositionIds(tenantId: string, positionId: string): Promise<string[]>;
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
