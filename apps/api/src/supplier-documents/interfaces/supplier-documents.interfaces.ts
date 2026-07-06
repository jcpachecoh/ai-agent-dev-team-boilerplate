import type {
  SupplierDocumentStatus,
  SupplierDocumentType,
  SupplierTipo,
  StorageVisibility,
} from '@prisma/client';

export type SupplierDocumentRequirement = 'REQUIRED' | 'CONDITIONAL' | 'RECOMMENDED';

export interface SupplierDocumentVersionRecord {
  id: string;
  tenantId: string;
  supplierDocumentId: string;
  storageObjectId: string;
  versionNumber: number;
  uploadedByUserId: string | null;
  uploadedAt: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  mimeType: string;
  size: number;
  originalName: string;
  visibility: StorageVisibility;
}

export interface SupplierDocumentRecord {
  id: string;
  tenantId: string;
  supplierId: string;
  documentType: SupplierDocumentType;
  status: SupplierDocumentStatus;
  issuedAt: Date | null;
  expiresAt: Date | null;
  lastUploadedAt: Date | null;
  uploadedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  currentVersion: SupplierDocumentVersionRecord | null;
}

export interface SupplierDocumentPolicyRecord {
  tenantId: string;
  camaraComercioValidityDays: number;
  rutAnnualReviewMonths: number;
}

export interface SupplierFlags {
  id: string;
  tenantId: string;
  tipo: SupplierTipo;
  isCritical: boolean;
  sellsRecurrentProducts: boolean;
  isFoodSupplier: boolean;
  handlesChemicals: boolean;
  isRawMaterialSupplier: boolean;
}

export interface ListSupplierDocumentsResult {
  supplier: SupplierFlags;
  documents: SupplierDocumentRecord[];
}

export interface DocumentCatalogItem {
  documentType: SupplierDocumentType;
  label: string;
  requirement: SupplierDocumentRequirement;
}

export interface ISupplierDocumentsRepository {
  findSupplierFlags(tenantId: string, supplierId: string): Promise<SupplierFlags | null>;
  findPolicy(tenantId: string): Promise<SupplierDocumentPolicyRecord>;
  listBySupplier(tenantId: string, supplierId: string): Promise<SupplierDocumentRecord[]>;
  findByType(
    tenantId: string,
    supplierId: string,
    documentType: SupplierDocumentType,
  ): Promise<SupplierDocumentRecord | null>;
  upsertWithVersion(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    issuedAt?: Date | null;
    expiresAt?: Date | null;
    storageObjectId: string;
    uploadedByUserId: string;
  }): Promise<SupplierDocumentRecord | null>;
  softDeleteCurrentVersion(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    deletedByUserId: string;
  }): Promise<SupplierDocumentRecord | null>;
  findVersionById(
    tenantId: string,
    supplierId: string,
    documentType: SupplierDocumentType,
    versionId: string,
  ): Promise<SupplierDocumentVersionRecord | null>;
  logAudit(params: {
    tenantId: string;
    actorUserId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    entityId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
  findAllActiveDocuments(): Promise<
    Array<{
      id: string;
      tenantId: string;
      supplierId: string;
      documentType: SupplierDocumentType;
      status: SupplierDocumentStatus;
      issuedAt: Date | null;
      expiresAt: Date | null;
      lastUploadedAt: Date | null;
      uploadedByUserId: string | null;
      currentVersion: { id: string } | null;
    }>
  >;
  findDocumentsExpiringInDays(
    days: number,
    referenceDate: Date,
  ): Promise<
    Array<{
      id: string;
      tenantId: string;
      supplierId: string;
      documentType: SupplierDocumentType;
      expiresAt: Date | null;
      uploadedByUserId: string | null;
    }>
  >;
  updateExpirationState(params: {
    tenantId: string;
    documentId: string;
    status: SupplierDocumentStatus;
    expiresAt: Date | null;
  }): Promise<void>;
  findPreviousVersion(
    tenantId: string,
    supplierId: string,
    documentType: SupplierDocumentType,
    currentVersionId: string | null,
  ): Promise<SupplierDocumentVersionRecord | null>;
}

export interface ISupplierDocumentsService {
  list(
    tenantId: string,
    supplierId: string,
  ): Promise<{
    completeness: { loaded: number; total: number; requiredPending: SupplierDocumentType[] };
    documents: Array<{
      documentType: SupplierDocumentType;
      label: string;
      requirement: SupplierDocumentRequirement;
      status: SupplierDocumentStatus;
      issuedAt: Date | null;
      expiresAt: Date | null;
      lastUploadedAt: Date | null;
      uploadedByUserId: string | null;
      needsReview: boolean;
      alertLevel: 'NONE' | 'WARNING' | 'URGENT';
      currentVersion: {
        id: string;
        storageObjectId: string;
        versionNumber: number;
        mimeType: string;
        size: number;
        originalName: string;
      } | null;
      previousVersion: {
        id: string;
        versionNumber: number;
        mimeType: string;
        originalName: string;
      } | null;
    }>;
  }>;
  getRequiredPending(tenantId: string, supplierId: string): Promise<SupplierDocumentType[]>;
  upsert(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    storageObjectId: string;
    issuedAt?: Date | null;
    expiresAt?: Date | null;
    actorUserId: string;
  }): Promise<SupplierDocumentRecord>;
  remove(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    actorUserId: string;
  }): Promise<SupplierDocumentRecord>;
  getDownloadUrl(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    actorUserId: string;
    versionId?: string;
  }): Promise<string>;
}
