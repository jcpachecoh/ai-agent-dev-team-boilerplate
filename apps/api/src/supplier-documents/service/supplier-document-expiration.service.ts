import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupplierDocumentType } from '@prisma/client';

import { SupplierDocumentsRepository } from '../repository/supplier-documents.repository';
import { computeDocumentExpiration, daysUntilExpiry } from '../supplier-documents.utils';

@Injectable()
export class SupplierDocumentExpirationService {
  constructor(private readonly repository: SupplierDocumentsRepository) {}

  @Cron('0 6 * * *')
  async handleDailyExpirationJob(): Promise<void> {
    await this.recalculateAllDocumentStatuses();
    await this.notifyDocumentsExpiringInDays(15);
  }

  async recalculateAllDocumentStatuses(referenceDate: Date = new Date()): Promise<number> {
    const documents = await this.repository.findAllActiveDocuments();
    let updated = 0;

    for (const document of documents) {
      const policy = await this.repository.findPolicy(document.tenantId);
      const expiration = computeDocumentExpiration(
        {
          documentType: document.documentType,
          lastUploadedAt: document.lastUploadedAt,
          issuedAt: document.issuedAt,
          expiresAt: document.expiresAt,
          rutAnnualReviewMonths: policy.rutAnnualReviewMonths,
          camaraComercioValidityDays: policy.camaraComercioValidityDays,
          hasCurrentVersion: Boolean(document.currentVersion),
        },
        referenceDate,
      );

      if (
        expiration.status !== document.status ||
        expiration.expiresAt?.getTime() !== document.expiresAt?.getTime()
      ) {
        await this.repository.updateExpirationState({
          tenantId: document.tenantId,
          documentId: document.id,
          status: expiration.status,
          expiresAt: expiration.expiresAt,
        });
        updated += 1;
      }
    }

    return updated;
  }

  async notifyDocumentsExpiringInDays(
    days: number,
    referenceDate: Date = new Date(),
  ): Promise<number> {
    const documents = await this.repository.findDocumentsExpiringInDays(days, referenceDate);
    let notified = 0;

    for (const document of documents) {
      const actorUserId = document.uploadedByUserId ?? document.supplierId;
      const daysLeft = daysUntilExpiry(referenceDate, document.expiresAt);

      await this.repository.logAudit({
        tenantId: document.tenantId,
        actorUserId,
        action: 'CREATE',
        entityId: document.id,
        payload: {
          kind: 'SUPPLIER_DOCUMENT_EXPIRATION_ALERT',
          supplierId: document.supplierId,
          documentType: document.documentType,
          expiresAt: document.expiresAt?.toISOString() ?? null,
          daysLeft,
        },
      });

      notified += 1;
    }

    return notified;
  }

  resolveExpirationForType(params: {
    documentType: SupplierDocumentType;
    lastUploadedAt: Date | null;
    issuedAt: Date | null;
    expiresAt: Date | null;
    rutAnnualReviewMonths: number;
    camaraComercioValidityDays: number;
    hasCurrentVersion: boolean;
    referenceDate?: Date;
  }) {
    return computeDocumentExpiration(
      {
        documentType: params.documentType,
        lastUploadedAt: params.lastUploadedAt,
        issuedAt: params.issuedAt,
        expiresAt: params.expiresAt,
        rutAnnualReviewMonths: params.rutAnnualReviewMonths,
        camaraComercioValidityDays: params.camaraComercioValidityDays,
        hasCurrentVersion: params.hasCurrentVersion,
      },
      params.referenceDate,
    );
  }
}
