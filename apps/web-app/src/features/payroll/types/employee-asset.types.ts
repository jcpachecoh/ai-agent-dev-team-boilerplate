export type AssetStatus = 'ACTIVO' | 'RETORNADO' | 'DADO_DE_BAJA';
export type AssetType = 'EDUCATIONAL' | 'FINANCIAL' | 'LEGAL' | 'DEPENDANTS';

export interface EmployeeAsset {
  id: string;
  tenantId: string;
  employeeId: string;
  assetName: string;
  type: AssetType;
  assignmentDate: string;
  value: number;
  status: AssetStatus;
  notes?: string | null;
  storageObjectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeAssetInput {
  employeeId: string;
  assetName: string;
  type: AssetType;
  value: number;
  assignmentDate?: string;
  notes?: string;
  storageObjectId?: string;
}

export interface UpdateEmployeeAssetInput {
  status?: AssetStatus;
  value?: number;
  notes?: string;
  storageObjectId?: string;
}

export interface EmployeeAssetDraft {
  assetName: string;
  type: AssetType | '';
  value: string;
  notes?: string;
  file?: File | null;
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  EDUCATIONAL: 'Educativo',
  FINANCIAL: 'Financiero',
  LEGAL: 'Legal',
  DEPENDANTS: 'Dependientes',
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  ACTIVO: 'Activo',
  RETORNADO: 'Retornado',
  DADO_DE_BAJA: 'Dado de baja',
};

export const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: 'EDUCATIONAL', label: 'Educativo' },
  { value: 'FINANCIAL', label: 'Financiero' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'DEPENDANTS', label: 'Dependientes' },
];

export const ASSET_STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'RETORNADO', label: 'Retornado' },
  { value: 'DADO_DE_BAJA', label: 'Dado de baja' },
];
