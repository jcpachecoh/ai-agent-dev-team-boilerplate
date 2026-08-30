import { SupplierDocumentType } from '@prisma/client';

import {
  computeDocumentExpiration,
  computeStatusFromExpiry,
  daysUntilExpiry,
  EXPIRING_THRESHOLD_DAYS,
} from '../supplier-documents.utils';

describe('supplier-documents.utils', () => {
  const now = new Date('2026-07-06T12:00:00.000Z');

  it('marks RUT as expired after annual review window', () => {
    const result = computeDocumentExpiration(
      {
        documentType: SupplierDocumentType.RUT,
        lastUploadedAt: new Date('2025-07-05T00:00:00.000Z'),
        issuedAt: null,
        expiresAt: null,
        rutAnnualReviewMonths: 11,
        camaraComercioValidityDays: 30,
        hasCurrentVersion: true,
      },
      now,
    );

    expect(result.status).toBe('EXPIRED');
    expect(result.needsReview).toBe(true);
  });

  it('calculates camara expiry from issuedAt and policy days', () => {
    const issuedAt = new Date('2026-06-01T00:00:00.000Z');
    const result = computeDocumentExpiration(
      {
        documentType: SupplierDocumentType.CAMARA_COMERCIO,
        lastUploadedAt: issuedAt,
        issuedAt,
        expiresAt: null,
        rutAnnualReviewMonths: 11,
        camaraComercioValidityDays: 30,
        hasCurrentVersion: true,
      },
      now,
    );

    expect(result.expiresAt?.toISOString()).toBe(
      new Date('2026-07-01T00:00:00.000Z').toISOString(),
    );
    expect(result.status).toBe('EXPIRED');
    expect(result.alertLevel).toBe('URGENT');
  });

  it('flags camara urgent alert below 7 days', () => {
    const issuedAt = new Date('2026-06-10T00:00:00.000Z');
    const result = computeDocumentExpiration(
      {
        documentType: SupplierDocumentType.CAMARA_COMERCIO,
        lastUploadedAt: issuedAt,
        issuedAt,
        expiresAt: null,
        rutAnnualReviewMonths: 11,
        camaraComercioValidityDays: 30,
        hasCurrentVersion: true,
      },
      now,
    );

    expect(result.status).toBe('EXPIRING');
    expect(result.alertLevel).toBe('URGENT');
  });

  it('returns pending when document has no current version', () => {
    const result = computeDocumentExpiration(
      {
        documentType: SupplierDocumentType.RUT,
        lastUploadedAt: null,
        issuedAt: null,
        expiresAt: null,
        rutAnnualReviewMonths: 11,
        camaraComercioValidityDays: 30,
        hasCurrentVersion: false,
      },
      now,
    );

    expect(result.status).toBe('PENDING');
  });

  it('uses expiring threshold of 15 days', () => {
    const expiresAt = new Date('2026-07-20T00:00:00.000Z');
    expect(daysUntilExpiry(now, expiresAt)).toBe(14);
    expect(computeStatusFromExpiry(expiresAt, now)).toBe('EXPIRING');
    expect(EXPIRING_THRESHOLD_DAYS).toBe(15);
  });

  it('returns null daysUntilExpiry when expiresAt is missing', () => {
    expect(daysUntilExpiry(now, null)).toBeNull();
    expect(computeStatusFromExpiry(null, now)).toBe('UPLOADED');
  });

  it('uses stored expiresAt for RUT when lastUploadedAt is missing', () => {
    const expiresAt = new Date('2026-08-01T00:00:00.000Z');
    const result = computeDocumentExpiration(
      {
        documentType: SupplierDocumentType.RUT,
        lastUploadedAt: null,
        issuedAt: null,
        expiresAt,
        rutAnnualReviewMonths: 11,
        camaraComercioValidityDays: 30,
        hasCurrentVersion: true,
      },
      now,
    );

    expect(result.expiresAt).toEqual(expiresAt);
    expect(result.status).toBe('UPLOADED');
  });

  it('marks RUT as expiring with warning alert inside threshold', () => {
    const lastUploadedAt = new Date('2025-08-15T00:00:00.000Z');
    const result = computeDocumentExpiration(
      {
        documentType: SupplierDocumentType.RUT,
        lastUploadedAt,
        issuedAt: null,
        expiresAt: null,
        rutAnnualReviewMonths: 11,
        camaraComercioValidityDays: 30,
        hasCurrentVersion: true,
      },
      now,
    );

    expect(result.status).toBe('EXPIRING');
    expect(result.alertLevel).toBe('WARNING');
  });

  it('computes expiration for generic document types from expiresAt', () => {
    const expiresAt = new Date('2026-07-20T00:00:00.000Z');
    const result = computeDocumentExpiration(
      {
        documentType: SupplierDocumentType.CERTIFICADO_BPM,
        lastUploadedAt: new Date(),
        issuedAt: null,
        expiresAt,
        rutAnnualReviewMonths: 11,
        camaraComercioValidityDays: 30,
        hasCurrentVersion: true,
      },
      now,
    );

    expect(result.status).toBe('EXPIRING');
    expect(result.alertLevel).toBe('WARNING');
  });
});
