export interface EmployeePosition {
  id: string;
  title: string;
  area: string;
  baseSalaryRange: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListEmployeePositionsFilters {
  includeInactive?: boolean;
  area?: string;
  search?: string;
}

export interface CreateEmployeePositionInput {
  title: string;
  area: string;
  baseSalaryRange: number;
}

export type UpdateEmployeePositionInput = Partial<CreateEmployeePositionInput> & {
  isActive?: boolean;
};
