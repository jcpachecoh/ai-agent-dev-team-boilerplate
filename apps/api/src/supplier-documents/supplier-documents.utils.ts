import { SupplierDocumentStatus, SupplierDocumentType } from '@prisma/client';

export const EXPIRING_THRESHOLD_DAYS = 15;
export const CAMARA_URGENT_THRESHOLD_DAYS = 7;

export type SupplierDocumentAlertLevel = 'NONE' | 'WARNING' | 'URGENT';

export interface DocumentExpirationInput {
  documentType: SupplierDocumentType;
  lastUploadedAt: Date | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  rutAnnualReviewMonths: number;
  camaraComercioValidityDays: number;
  hasCurrentVersion: boolean;
}

export interface DocumentExpirationResult {
  status: SupplierDocumentStatus;
  expiresAt: Date | null;
  needsReview: boolean;
  alertLevel: SupplierDocumentAlertLevel;
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysUntilExpiry(now: Date, expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const diffMs = startOfDay(expiresAt).getTime() - startOfDay(now).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function computeStatusFromExpiry(expiresAt: Date | null, now: Date): SupplierDocumentStatus {
  if (!expiresAt) return SupplierDocumentStatus.UPLOADED;
  const daysLeft = daysUntilExpiry(now, expiresAt);
  if (daysLeft === null) return SupplierDocumentStatus.UPLOADED;
  if (daysLeft < 0) return SupplierDocumentStatus.EXPIRED;
  if (daysLeft <= EXPIRING_THRESHOLD_DAYS) return SupplierDocumentStatus.EXPIRING;
  return SupplierDocumentStatus.UPLOADED;
}

export function computeDocumentExpiration(
  input: DocumentExpirationInput,
  now: Date = new Date(),
): DocumentExpirationResult {
  if (!input.hasCurrentVersion) {
    return {
      status: SupplierDocumentStatus.PENDING,
      expiresAt: null,
      needsReview: false,
      alertLevel: 'NONE',
    };
  }

  if (input.documentType === SupplierDocumentType.RUT) {
    const expiresAt = input.lastUploadedAt
      ? addMonths(input.lastUploadedAt, input.rutAnnualReviewMonths)
      : input.expiresAt;
    const status = computeStatusFromExpiry(expiresAt, now);
    return {
      status,
      expiresAt,
      needsReview: status === SupplierDocumentStatus.EXPIRED,
      alertLevel: status === SupplierDocumentStatus.EXPIRING ? 'WARNING' : 'NONE',
    };
  }

  if (input.documentType === SupplierDocumentType.CAMARA_COMERCIO) {
    const expiresAt =
      input.expiresAt ??
      (input.issuedAt ? addDays(input.issuedAt, input.camaraComercioValidityDays) : null);
    const status = computeStatusFromExpiry(expiresAt, now);
    const daysLeft = daysUntilExpiry(now, expiresAt);
    const alertLevel: SupplierDocumentAlertLevel =
      status === SupplierDocumentStatus.EXPIRED
        ? 'URGENT'
        : daysLeft !== null && daysLeft < CAMARA_URGENT_THRESHOLD_DAYS
          ? 'URGENT'
          : status === SupplierDocumentStatus.EXPIRING
            ? 'WARNING'
            : 'NONE';
    return { status, expiresAt, needsReview: false, alertLevel };
  }

  const status = computeStatusFromExpiry(input.expiresAt, now);
  return {
    status,
    expiresAt: input.expiresAt,
    needsReview: false,
    alertLevel: status === SupplierDocumentStatus.EXPIRING ? 'WARNING' : 'NONE',
  };
}
