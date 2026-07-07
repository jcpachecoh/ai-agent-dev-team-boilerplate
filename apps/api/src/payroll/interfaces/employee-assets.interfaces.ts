import type { AssetStatus, AssetType } from '@prisma/client';

export interface EmployeeAssetRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  assetName: string;
  type: AssetType;
  assignmentDate: Date;
  value: string;
  status: AssetStatus;
  notes: string | null;
  storageObjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeAssetData {
  employeeId: string;
  assetName: string;
  type: AssetType;
  value: string;
  assignmentDate?: Date;
  notes?: string;
  storageObjectId?: string;
}

export interface UpdateEmployeeAssetData {
  status?: AssetStatus;
  value?: string;
  notes?: string;
  storageObjectId?: string;
}

export interface ListEmployeeAssetsOptions {
  status?: AssetStatus;
  type?: AssetType;
}

export interface IEmployeeAssetsRepository {
  create(tenantId: string, data: CreateEmployeeAssetData): Promise<EmployeeAssetRecord>;
  findById(tenantId: string, id: string): Promise<EmployeeAssetRecord | null>;
  findByEmployee(
    tenantId: string,
    employeeId: string,
    options?: ListEmployeeAssetsOptions,
  ): Promise<EmployeeAssetRecord[]>;
  findActiveByEmployeeAndName(
    tenantId: string,
    employeeId: string,
    assetName: string,
  ): Promise<EmployeeAssetRecord | null>;
  update(tenantId: string, id: string, data: UpdateEmployeeAssetData): Promise<EmployeeAssetRecord>;
}

export interface IEmployeeAssetsService {
  create(tenantId: string, data: CreateEmployeeAssetData): Promise<EmployeeAssetRecord>;
  findById(tenantId: string, id: string): Promise<EmployeeAssetRecord>;
  findByEmployee(
    tenantId: string,
    employeeId: string,
    options?: ListEmployeeAssetsOptions,
  ): Promise<EmployeeAssetRecord[]>;
  update(tenantId: string, id: string, data: UpdateEmployeeAssetData): Promise<EmployeeAssetRecord>;
  getActiveAssetsForPayroll(tenantId: string, employeeId: string): Promise<EmployeeAssetRecord[]>;
  getDownloadUrl(tenantId: string, id: string): Promise<string>;
}
