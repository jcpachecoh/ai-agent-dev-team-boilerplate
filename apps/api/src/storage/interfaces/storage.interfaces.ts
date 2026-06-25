import type {
  ImageProfile,
  StorageDomain,
  StorageObjectStatus,
  StorageProviderType,
  StorageVisibility,
} from '../enums/storage.enums';

// ─── Provider contract ────────────────────────────────────────────────────────

export interface StorageProviderUploadOptions {
  key: string;
  bucket: string;
  buffer: Buffer;
  mimeType: string;
  visibility: StorageVisibility;
  metadata?: Record<string, string>;
}

export interface StorageProviderUploadResult {
  key: string;
  etag?: string;
}

export interface StorageProvider {
  upload(options: StorageProviderUploadOptions): Promise<StorageProviderUploadResult>;
  delete(key: string, bucket: string): Promise<void>;
  getPresignedUrl(key: string, bucket: string, ttlSeconds: number): Promise<string>;
  exists(key: string, bucket: string): Promise<boolean>;
  readonly providerType: StorageProviderType;
  readonly bucketName: string;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

// ─── StorageService inputs ────────────────────────────────────────────────────

export interface UploadFileOptions {
  tenantId: string;
  uploadedBy: string;
  domain: StorageDomain;
  imageProfile?: ImageProfile;
  entityType?: string;
  entityId?: string;
  visibility?: StorageVisibility;
  file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  };
}

// ─── StorageService outputs ───────────────────────────────────────────────────

export interface StorageObjectResult {
  id: string;
  tenantId: string;
  provider: StorageProviderType;
  bucket: string;
  key: string;
  mimeType: string;
  size: number;
  checksum: string;
  etag: string | null;
  originalName: string;
  domain: StorageDomain;
  entityType: string | null;
  entityId: string | null;
  uploadedBy: string;
  visibility: StorageVisibility;
  status: StorageObjectStatus;
  metadata: Record<string, unknown> | null;
  publicUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ─── Module config ────────────────────────────────────────────────────────────

export interface StorageModuleOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: new (...args: any[]) => StorageProvider;
}
