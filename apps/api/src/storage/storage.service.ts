import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageProfile, StorageObjectStatus, StorageVisibility } from './enums/storage.enums';
import { processImage, extensionFromMime } from './image/image-processor';
import type {
  StorageObjectResult,
  StorageProvider,
  UploadFileOptions,
} from './interfaces/storage.interfaces';
import { STORAGE_PROVIDER } from './interfaces/storage.interfaces';

/**
 * Normalizes R2_PUBLIC_DOMAIN to a consistent https:// base URL with no trailing slash.
 * Accepts both "assets.opssynk.com" and "https://assets.opssynk.com".
 */
function normalizePublicDomain(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

const PUBLIC_DOMAIN = (): string => normalizePublicDomain(process.env.R2_PUBLIC_DOMAIN ?? '');

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: StorageProvider,
    private readonly prisma: PrismaService,
  ) {}

  async uploadFile(options: UploadFileOptions): Promise<StorageObjectResult> {
    const visibility = options.visibility ?? StorageVisibility.PUBLIC;
    const imageProfile = options.imageProfile ?? ImageProfile.NONE;

    const processed = await processImage(options.file.buffer, options.file.mimetype, imageProfile);

    const filename = this.buildFilename(options.file.originalname, processed.extension);
    const key = this.buildKey(options.tenantId, options.domain, filename);
    const checksum = this.computeChecksum(processed.buffer);

    const { etag } = await this.provider.upload({
      key,
      bucket: this.provider.bucketName,
      buffer: processed.buffer,
      mimeType: processed.mimeType,
      visibility,
    });

    const record = await this.prisma.storageObject.create({
      data: {
        tenantId: options.tenantId,
        provider: this.provider.providerType,
        bucket: this.provider.bucketName,
        key,
        mimeType: processed.mimeType,
        size: processed.buffer.byteLength,
        checksum,
        etag: etag ?? null,
        originalName: options.file.originalname,
        domain: options.domain,
        entityType: options.entityType ?? null,
        entityId: options.entityId ?? null,
        uploadedBy: options.uploadedBy,
        visibility,
        status: StorageObjectStatus.ACTIVE,
      },
    });

    this.logger.log(`StorageObject created: ${record.id} key=${key}`);
    return this.toResult(record);
  }

  async deleteFile(id: string, tenantId: string): Promise<void> {
    const record = await this.prisma.storageObject.findFirst({
      where: { id, tenantId, status: StorageObjectStatus.ACTIVE, deletedAt: null },
    });

    if (!record) {
      throw new NotFoundException(`StorageObject ${id} no encontrado`);
    }

    // Soft delete first — DB is the source of truth.
    // providerDeletePending=true marks objects whose R2 counterpart may still exist.
    // A future cleanup job can query: WHERE status='DELETED' AND metadata->>'providerDeletePending'='true'
    const existingMeta = (record.metadata as Record<string, unknown> | null) ?? {};
    await this.prisma.storageObject.update({
      where: { id },
      data: {
        status: StorageObjectStatus.DELETED,
        deletedAt: new Date(),
        metadata: { ...existingMeta, providerDeletePending: true },
      },
    });

    try {
      await this.provider.delete(record.key, record.bucket);
      // R2 delete succeeded — clear the pending flag
      await this.prisma.storageObject.update({
        where: { id },
        data: { metadata: { ...existingMeta, providerDeletePending: false } },
      });
    } catch (err) {
      // DB soft delete already happened — no data loss, no security exposure.
      // The key is stored in DB; a retry job can pick this up via providerDeletePending=true.
      this.logger.error(
        `[STORAGE_DELETE_PENDING] R2 delete failed for id=${id} key=${record.key} bucket=${record.bucket}: ${String(err)}`,
      );
    }
  }

  async getPresignedUrl(id: string, tenantId: string, ttlSeconds: number): Promise<string> {
    const record = await this.prisma.storageObject.findFirst({
      where: { id, tenantId, status: StorageObjectStatus.ACTIVE, deletedAt: null },
    });

    if (!record) {
      throw new NotFoundException(`StorageObject ${id} no encontrado`);
    }

    if (record.visibility === StorageVisibility.PUBLIC) {
      return this.buildPublicUrl(record.key);
    }

    return this.provider.getPresignedUrl(record.key, record.bucket, ttlSeconds);
  }

  async findById(id: string, tenantId: string): Promise<StorageObjectResult> {
    const record = await this.prisma.storageObject.findFirst({
      where: { id, tenantId, status: StorageObjectStatus.ACTIVE, deletedAt: null },
    });

    if (!record) {
      throw new NotFoundException(`StorageObject ${id} no encontrado`);
    }

    return this.toResult(record);
  }

  buildPublicUrl(key: string): string {
    return `${PUBLIC_DOMAIN()}/${key}`;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildKey(tenantId: string, domain: string, filename: string): string {
    return `tenants/${tenantId}/${domain.toLowerCase()}/${filename}`;
  }

  private buildFilename(originalname: string, extension: string): string {
    const uuid = randomUUID();
    return `${uuid}.${extension}`;
  }

  private computeChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private toResult(record: {
    id: string;
    tenantId: string;
    provider: string;
    bucket: string;
    key: string;
    mimeType: string;
    size: number;
    checksum: string;
    etag: string | null;
    originalName: string;
    domain: string;
    entityType: string | null;
    entityId: string | null;
    uploadedBy: string;
    visibility: string;
    status: string;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): StorageObjectResult {
    const isPublic = record.visibility === StorageVisibility.PUBLIC;
    return {
      id: record.id,
      tenantId: record.tenantId,
      provider: record.provider as StorageObjectResult['provider'],
      bucket: record.bucket,
      key: record.key,
      mimeType: record.mimeType,
      size: record.size,
      checksum: record.checksum,
      etag: record.etag,
      originalName: record.originalName,
      domain: record.domain as StorageObjectResult['domain'],
      entityType: record.entityType,
      entityId: record.entityId,
      uploadedBy: record.uploadedBy,
      visibility: record.visibility as StorageObjectResult['visibility'],
      status: record.status as StorageObjectResult['status'],
      metadata: record.metadata as Record<string, unknown> | null,
      publicUrl: isPublic ? this.buildPublicUrl(record.key) : null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    };
  }
}
