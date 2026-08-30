import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma, SupplierDocumentType, SupplierDocumentStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  ISupplierDocumentsRepository,
  SupplierDocumentPolicyRecord,
  SupplierDocumentRecord,
  SupplierDocumentVersionRecord,
  SupplierFlags,
} from '../interfaces/supplier-documents.interfaces';

@Injectable()
export class SupplierDocumentsRepository implements ISupplierDocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSupplierFlags(tenantId: string, supplierId: string): Promise<SupplierFlags | null> {
    return this.prisma.supplier.findFirst({
      where: { id: supplierId, tenantId },
      select: {
        id: true,
        tenantId: true,
        tipo: true,
        isCritical: true,
        sellsRecurrentProducts: true,
        isFoodSupplier: true,
        handlesChemicals: true,
        isRawMaterialSupplier: true,
      },
    });
  }

  async findPolicy(tenantId: string): Promise<SupplierDocumentPolicyRecord> {
    const policy = await this.prisma.supplierDocumentPolicy.findUnique({ where: { tenantId } });
    if (policy) {
      return policy;
    }
    return this.prisma.supplierDocumentPolicy.create({
      data: {
        tenantId,
        camaraComercioValidityDays: 30,
        rutAnnualReviewMonths: 11,
      },
    });
  }

  async listBySupplier(tenantId: string, supplierId: string): Promise<SupplierDocumentRecord[]> {
    const rows = await this.prisma.supplierDocument.findMany({
      where: { tenantId, supplierId, deletedAt: null },
      include: {
        currentVersion: {
          include: {
            storageObject: {
              select: {
                mimeType: true,
                size: true,
                originalName: true,
                visibility: true,
              },
            },
          },
        },
      },
    });
    return rows.map((row) => this.mapDocument(row));
  }

  async findByType(
    tenantId: string,
    supplierId: string,
    documentType: SupplierDocumentType,
  ): Promise<SupplierDocumentRecord | null> {
    const row = await this.prisma.supplierDocument.findFirst({
      where: { tenantId, supplierId, documentType, deletedAt: null },
      include: {
        currentVersion: {
          include: {
            storageObject: {
              select: {
                mimeType: true,
                size: true,
                originalName: true,
                visibility: true,
              },
            },
          },
        },
      },
    });
    return row ? this.mapDocument(row) : null;
  }

  async upsertWithVersion(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    issuedAt?: Date | null;
    expiresAt?: Date | null;
    storageObjectId: string;
    uploadedByUserId: string;
  }): Promise<SupplierDocumentRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.supplierDocument.findFirst({
        where: {
          tenantId: params.tenantId,
          supplierId: params.supplierId,
          documentType: params.documentType,
          deletedAt: null,
        },
        include: {
          versions: {
            where: { deletedAt: null },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
          },
        },
      });

      const nextVersion = (existing?.versions[0]?.versionNumber ?? 0) + 1;

      const document =
        existing ??
        (await tx.supplierDocument.create({
          data: {
            tenantId: params.tenantId,
            supplierId: params.supplierId,
            documentType: params.documentType,
            status: SupplierDocumentStatus.UPLOADED,
            issuedAt: params.issuedAt ?? null,
            expiresAt: params.expiresAt ?? null,
            lastUploadedAt: new Date(),
            uploadedByUserId: params.uploadedByUserId,
          },
        }));

      const version = await tx.supplierDocumentVersion.create({
        data: {
          tenantId: params.tenantId,
          supplierDocumentId: document.id,
          storageObjectId: params.storageObjectId,
          versionNumber: nextVersion,
          uploadedByUserId: params.uploadedByUserId,
        },
      });

      await tx.supplierDocument.update({
        where: { id: document.id },
        data: {
          status: SupplierDocumentStatus.UPLOADED,
          issuedAt: params.issuedAt ?? existing?.issuedAt ?? null,
          expiresAt: params.expiresAt ?? existing?.expiresAt ?? null,
          currentVersionId: version.id,
          uploadedByUserId: params.uploadedByUserId,
          lastUploadedAt: version.uploadedAt,
          deletedAt: null,
        },
      });

      const row = await tx.supplierDocument.findUnique({
        where: { id: document.id },
        include: {
          currentVersion: {
            include: {
              storageObject: {
                select: {
                  mimeType: true,
                  size: true,
                  originalName: true,
                  visibility: true,
                },
              },
            },
          },
        },
      });

      return row ? this.mapDocument(row) : null;
    });
  }

  async softDeleteCurrentVersion(params: {
    tenantId: string;
    supplierId: string;
    documentType: SupplierDocumentType;
    deletedByUserId: string;
  }): Promise<SupplierDocumentRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.supplierDocument.findFirst({
        where: {
          tenantId: params.tenantId,
          supplierId: params.supplierId,
          documentType: params.documentType,
          deletedAt: null,
        },
        include: {
          versions: {
            where: { deletedAt: null },
            orderBy: { versionNumber: 'desc' },
          },
        },
      });

      if (!current) return null;

      const activeVersion = current.versions.find((row) => row.id === current.currentVersionId);
      if (activeVersion) {
        await tx.supplierDocumentVersion.update({
          where: { id: activeVersion.id },
          data: { deletedAt: new Date() },
        });
      }

      const previous = current.versions.find((row) => row.id !== current.currentVersionId) ?? null;

      await tx.supplierDocument.update({
        where: { id: current.id },
        data: {
          status: previous ? SupplierDocumentStatus.UPLOADED : SupplierDocumentStatus.PENDING,
          currentVersionId: previous?.id ?? null,
          uploadedByUserId: params.deletedByUserId,
          lastUploadedAt: previous?.uploadedAt ?? null,
        },
      });

      const updated = await tx.supplierDocument.findUnique({
        where: { id: current.id },
        include: {
          currentVersion: {
            include: {
              storageObject: {
                select: {
                  mimeType: true,
                  size: true,
                  originalName: true,
                  visibility: true,
                },
              },
            },
          },
        },
      });

      return updated ? this.mapDocument(updated) : null;
    });
  }

  async findVersionById(
    tenantId: string,
    supplierId: string,
    documentType: SupplierDocumentType,
    versionId: string,
  ): Promise<SupplierDocumentVersionRecord | null> {
    const row = await this.prisma.supplierDocumentVersion.findFirst({
      where: {
        id: versionId,
        tenantId,
        supplierDocument: {
          supplierId,
          documentType,
          deletedAt: null,
        },
      },
      include: {
        storageObject: {
          select: {
            mimeType: true,
            size: true,
            originalName: true,
            visibility: true,
          },
        },
      },
    });

    return row
      ? {
          id: row.id,
          tenantId: row.tenantId,
          supplierDocumentId: row.supplierDocumentId,
          storageObjectId: row.storageObjectId,
          versionNumber: row.versionNumber,
          uploadedByUserId: row.uploadedByUserId,
          uploadedAt: row.uploadedAt,
          deletedAt: row.deletedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          mimeType: row.storageObject.mimeType,
          size: row.storageObject.size,
          originalName: row.storageObject.originalName,
          visibility: row.storageObject.visibility,
        }
      : null;
  }

  async logAudit(params: {
    tenantId: string;
    actorUserId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    entityId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        actorUserId: params.actorUserId,
        action: params.action as AuditAction,
        entityType: 'SupplierDocument',
        entityId: params.entityId,
        payload: params.payload as Prisma.InputJsonValue,
      },
    });
  }

  async findAllActiveDocuments() {
    const rows = await this.prisma.supplierDocument.findMany({
      where: { deletedAt: null, currentVersionId: { not: null } },
      select: {
        id: true,
        tenantId: true,
        supplierId: true,
        documentType: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
        lastUploadedAt: true,
        uploadedByUserId: true,
        currentVersion: { select: { id: true } },
      },
    });
    return rows;
  }

  async findDocumentsExpiringInDays(days: number, referenceDate: Date) {
    const target = new Date(referenceDate);
    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() + days);
    const nextDay = new Date(target);
    nextDay.setDate(nextDay.getDate() + 1);

    const rows = await this.prisma.supplierDocument.findMany({
      where: {
        deletedAt: null,
        currentVersionId: { not: null },
        expiresAt: { gte: target, lt: nextDay },
      },
      select: {
        id: true,
        tenantId: true,
        supplierId: true,
        documentType: true,
        expiresAt: true,
        uploadedByUserId: true,
      },
    });
    return rows;
  }

  async updateExpirationState(params: {
    tenantId: string;
    documentId: string;
    status: SupplierDocumentStatus;
    expiresAt: Date | null;
  }): Promise<void> {
    await this.prisma.supplierDocument.updateMany({
      where: { id: params.documentId, tenantId: params.tenantId },
      data: {
        status: params.status,
        expiresAt: params.expiresAt,
      },
    });
  }

  async findPreviousVersion(
    tenantId: string,
    supplierId: string,
    documentType: SupplierDocumentType,
    currentVersionId: string | null,
  ): Promise<SupplierDocumentVersionRecord | null> {
    if (!currentVersionId) return null;

    const row = await this.prisma.supplierDocumentVersion.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        id: { not: currentVersionId },
        supplierDocument: {
          supplierId,
          documentType,
          deletedAt: null,
        },
      },
      orderBy: { versionNumber: 'desc' },
      include: {
        storageObject: {
          select: {
            mimeType: true,
            size: true,
            originalName: true,
            visibility: true,
          },
        },
      },
    });

    return row
      ? {
          id: row.id,
          tenantId: row.tenantId,
          supplierDocumentId: row.supplierDocumentId,
          storageObjectId: row.storageObjectId,
          versionNumber: row.versionNumber,
          uploadedByUserId: row.uploadedByUserId,
          uploadedAt: row.uploadedAt,
          deletedAt: row.deletedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          mimeType: row.storageObject.mimeType,
          size: row.storageObject.size,
          originalName: row.storageObject.originalName,
          visibility: row.storageObject.visibility,
        }
      : null;
  }

  private mapDocument(row: {
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
    currentVersion: {
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
      storageObject: {
        mimeType: string;
        size: number;
        originalName: string;
        visibility: 'PUBLIC' | 'PRIVATE';
      };
    } | null;
  }): SupplierDocumentRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      supplierId: row.supplierId,
      documentType: row.documentType,
      status: row.status,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      lastUploadedAt: row.lastUploadedAt,
      uploadedByUserId: row.uploadedByUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      currentVersion: row.currentVersion
        ? {
            id: row.currentVersion.id,
            tenantId: row.currentVersion.tenantId,
            supplierDocumentId: row.currentVersion.supplierDocumentId,
            storageObjectId: row.currentVersion.storageObjectId,
            versionNumber: row.currentVersion.versionNumber,
            uploadedByUserId: row.currentVersion.uploadedByUserId,
            uploadedAt: row.currentVersion.uploadedAt,
            deletedAt: row.currentVersion.deletedAt,
            createdAt: row.currentVersion.createdAt,
            updatedAt: row.currentVersion.updatedAt,
            mimeType: row.currentVersion.storageObject.mimeType,
            size: row.currentVersion.storageObject.size,
            originalName: row.currentVersion.storageObject.originalName,
            visibility: row.currentVersion.storageObject.visibility,
          }
        : null,
    };
  }
}
