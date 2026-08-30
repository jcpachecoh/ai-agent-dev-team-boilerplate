import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupplierDocumentType } from '@prisma/client';

import { StorageService } from '../../storage/service/storage.service';
import {
  buildSupplierDocumentCatalog,
  SUPPLIER_DOCUMENT_ALLOWED_MIME_TYPES,
  SUPPLIER_DOCUMENT_MAX_SIZE_BYTES,
} from '../supplier-documents.constants';
import { SupplierDocumentsRepository } from '../repository/supplier-documents.repository';
import { SupplierDocumentExpirationService } from './supplier-document-expiration.service';
import type { ISupplierDocumentsService } from '../interfaces/supplier-documents.interfaces';
import type { SupplierDocumentAlertLevel } from '../supplier-documents.utils';

export interface ListSupplierDocumentsResponse {
  completeness: {
    loaded: number;
    total: number;
    requiredPending: SupplierDocumentType[];
  };
  documents: Array<{
    documentType: SupplierDocumentType;
    label: string;
    requirement: 'REQUIRED' | 'CONDITIONAL' | 'RECOMMENDED';
    status: 'PENDING' | 'UPLOADED' | 'EXPIRING' | 'EXPIRED';
    issuedAt: Date | null;
    expiresAt: Date | null;
    lastUploadedAt: Date | null;
    uploadedByUserId: string | null;
    needsReview: boolean;
    alertLevel: SupplierDocumentAlertLevel;
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
}

@Injectable()
export class SupplierDocumentsService implements ISupplierDocumentsService {
  constructor(
    private readonly repository: SupplierDocumentsRepository,
    private readonly storageService: StorageService,
    private readonly expirationService: SupplierDocumentExpirationService,
  ) {}

  async getRequiredPending(tenantId: string, supplierId: string): Promise<SupplierDocumentType[]> {
    const result = await this.list(tenantId, supplierId);
    return result.completeness.requiredPending;
  }

  async list(tenantId: string, supplierId: string): Promise<ListSupplierDocumentsResponse> {
    const supplier = await this.repository.findSupplierFlags(tenantId, supplierId);
    if (!supplier) {
      throw new NotFoundException(`Supplier "${supplierId}" not found`);
    }

    const policy = await this.repository.findPolicy(tenantId);
    const catalog = buildSupplierDocumentCatalog(supplier);
    const rows = await this.repository.listBySupplier(tenantId, supplierId);
    const byType = new Map(rows.map((row) => [row.documentType, row]));

    const documents = await Promise.all(
      catalog.map(async (item) => {
        const row = byType.get(item.documentType);
        const expiration = this.expirationService.resolveExpirationForType({
          documentType: item.documentType,
          lastUploadedAt: row?.lastUploadedAt ?? null,
          issuedAt: row?.issuedAt ?? null,
          expiresAt: row?.expiresAt ?? null,
          rutAnnualReviewMonths: policy.rutAnnualReviewMonths,
          camaraComercioValidityDays: policy.camaraComercioValidityDays,
          hasCurrentVersion: Boolean(row?.currentVersion),
        });

        const previousVersion = row?.currentVersion
          ? await this.repository.findPreviousVersion(
              tenantId,
              supplierId,
              item.documentType,
              row.currentVersion.id,
            )
          : null;

        return {
          documentType: item.documentType,
          label: item.label,
          requirement: item.requirement,
          status: expiration.status,
          issuedAt: row?.issuedAt ?? null,
          expiresAt: expiration.expiresAt,
          lastUploadedAt: row?.lastUploadedAt ?? null,
          uploadedByUserId: row?.uploadedByUserId ?? null,
          needsReview: expiration.needsReview,
          alertLevel: expiration.alertLevel,
          currentVersion: row?.currentVersion
            ? {
                id: row.currentVersion.id,
                storageObjectId: row.currentVersion.storageObjectId,
                versionNumber: row.currentVersion.versionNumber,
                mimeType: row.currentVersion.mimeType,
                size: row.currentVersion.size,
                originalName: row.currentVersion.originalName,
              }
            : null,
          previousVersion: previousVersion
            ? {
                id: previousVersion.id,
                versionNumber: previousVersion.versionNumber,
                mimeType: previousVersion.mimeType,
                originalName: previousVersion.originalName,
              }
            : null,
        };
      }),
    );

    const loaded = documents.filter((row) => row.currentVersion).length;
    const requiredPending = documents
      .filter((row) => row.requirement === 'REQUIRED' && !row.currentVersion)
      .map((row) => row.documentType);

    return {
      completeness: {
        loaded,
        total: documents.length,
        requiredPending,
      },
      documents,
    };
  }

  async upsert(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    storageObjectId: string;
    issuedAt?: Date | null;
    expiresAt?: Date | null;
    actorUserId: string;
  }) {
    const supplier = await this.repository.findSupplierFlags(params.tenantId, params.supplierId);
    if (!supplier) {
      throw new NotFoundException(`Supplier "${params.supplierId}" not found`);
    }

    const storageObject = await this.storageService.findById(
      params.storageObjectId,
      params.tenantId,
    );

    if (storageObject.domain !== 'SUPPLIERS') {
      throw new BadRequestException('Storage object domain must be SUPPLIERS');
    }
    if (storageObject.entityType !== 'Supplier' || storageObject.entityId !== params.supplierId) {
      throw new BadRequestException('Storage object must be linked to the same supplier');
    }
    if (storageObject.size > SUPPLIER_DOCUMENT_MAX_SIZE_BYTES) {
      throw new BadRequestException('El archivo no puede superar 5 MB');
    }
    if (
      !SUPPLIER_DOCUMENT_ALLOWED_MIME_TYPES.includes(
        storageObject.mimeType as (typeof SUPPLIER_DOCUMENT_ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException('Formato no permitido. Usa PDF, JPG o PNG');
    }

    const policy = await this.repository.findPolicy(params.tenantId);
    const issuedAt = params.issuedAt ?? null;
    let expiresAt = params.expiresAt ?? null;

    if (params.documentType === SupplierDocumentType.CAMARA_COMERCIO && issuedAt && !expiresAt) {
      const computed = this.expirationService.resolveExpirationForType({
        documentType: params.documentType,
        lastUploadedAt: new Date(),
        issuedAt,
        expiresAt: null,
        rutAnnualReviewMonths: policy.rutAnnualReviewMonths,
        camaraComercioValidityDays: policy.camaraComercioValidityDays,
        hasCurrentVersion: true,
      });
      expiresAt = computed.expiresAt;
    }

    const document = await this.repository.upsertWithVersion({
      tenantId: params.tenantId,
      supplierId: params.supplierId,
      documentType: params.documentType,
      storageObjectId: params.storageObjectId,
      issuedAt,
      expiresAt,
      uploadedByUserId: params.actorUserId,
    });
    if (!document) {
      throw new NotFoundException('No fue posible asociar el documento al proveedor');
    }

    const expiration = this.expirationService.resolveExpirationForType({
      documentType: params.documentType,
      lastUploadedAt: document.lastUploadedAt,
      issuedAt: document.issuedAt,
      expiresAt: document.expiresAt,
      rutAnnualReviewMonths: policy.rutAnnualReviewMonths,
      camaraComercioValidityDays: policy.camaraComercioValidityDays,
      hasCurrentVersion: Boolean(document.currentVersion),
    });

    await this.repository.updateExpirationState({
      tenantId: params.tenantId,
      documentId: document.id,
      status: expiration.status,
      expiresAt: expiration.expiresAt,
    });

    await this.repository.logAudit({
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      action: document.currentVersion?.versionNumber === 1 ? 'CREATE' : 'UPDATE',
      entityId: document.id,
      payload: {
        supplierId: params.supplierId,
        documentType: params.documentType,
        storageObjectId: params.storageObjectId,
        versionNumber: document.currentVersion?.versionNumber ?? 1,
      },
    });

    return {
      ...document,
      status: expiration.status,
      expiresAt: expiration.expiresAt,
    };
  }

  async remove(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    actorUserId: string;
  }) {
    const document = await this.repository.softDeleteCurrentVersion({
      tenantId: params.tenantId,
      supplierId: params.supplierId,
      documentType: params.documentType,
      deletedByUserId: params.actorUserId,
    });
    if (!document) {
      throw new NotFoundException(`Document "${params.documentType}" not found`);
    }

    await this.repository.logAudit({
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      action: 'DELETE',
      entityId: document.id,
      payload: {
        supplierId: params.supplierId,
        documentType: params.documentType,
        currentVersionId: document.currentVersion?.id ?? null,
      },
    });

    return document;
  }

  async getDownloadUrl(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    actorUserId: string;
    versionId?: string;
  }): Promise<string> {
    const record = params.versionId
      ? await this.repository.findVersionById(
          params.tenantId,
          params.supplierId,
          params.documentType,
          params.versionId,
        )
      : ((await this.repository.findByType(params.tenantId, params.supplierId, params.documentType))
          ?.currentVersion ?? null);

    if (!record) {
      throw new NotFoundException(`Document "${params.documentType}" has no uploaded version`);
    }

    const url = await this.storageService.getPresignedUrl(
      record.storageObjectId,
      params.tenantId,
      900,
    );

    await this.repository.logAudit({
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      action: 'VIEW',
      entityId: record.supplierDocumentId,
      payload: {
        supplierId: params.supplierId,
        documentType: params.documentType,
        versionId: record.id,
        storageObjectId: record.storageObjectId,
      },
    });

    return url;
  }
}
