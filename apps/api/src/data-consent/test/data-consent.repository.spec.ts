import { ConsentType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { DataConsentRepository } from '../repository/data-consent.repository';

describe('DataConsentRepository', () => {
  const prisma = {
    employeeDetails: { findFirst: jest.fn() },
    dataProcessingPolicy: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
    },
    dataConsent: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const repository = new DataConsentRepository(prisma);

  const TENANT_ID = 'palos-de-lena';
  const EMPLOYEE_ID = 'emp-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findEmployeeByUserId filtra por tenant y soft delete', async () => {
    const employee = {
      id: EMPLOYEE_ID,
      pinHash: null,
      photoStorageObjectId: null,
      personalData: null,
    };
    (prisma.employeeDetails.findFirst as jest.Mock).mockResolvedValue(employee);

    const result = await repository.findEmployeeByUserId('user-001', TENANT_ID);

    expect(prisma.employeeDetails.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-001', tenantId: TENANT_ID, deletedAt: null },
      select: {
        id: true,
        pinHash: true,
        photoStorageObjectId: true,
        personalData: { select: { profilePhotoStorageObjectId: true } },
      },
    });
    expect(result).toBe(employee);
  });

  it('findActivePolicy devuelve la política activa del tenant', async () => {
    const policy = { id: 'policy-1', tenantId: TENANT_ID, version: '2026.07.1', isActive: true };
    (prisma.dataProcessingPolicy.findFirst as jest.Mock).mockResolvedValue(policy);

    await expect(repository.findActivePolicy(TENANT_ID)).resolves.toBe(policy);
  });

  it('findPoliciesByTenant lista políticas no eliminadas', async () => {
    const policies = [{ id: 'policy-1' }];
    (prisma.dataProcessingPolicy.findMany as jest.Mock).mockResolvedValue(policies);

    await expect(repository.findPoliciesByTenant(TENANT_ID)).resolves.toBe(policies);
  });

  it('findConsentsByEmployeeAndVersion filtra por versión de política', async () => {
    const consents = [{ id: 'consent-1' }];
    (prisma.dataConsent.findMany as jest.Mock).mockResolvedValue(consents);

    await expect(
      repository.findConsentsByEmployeeAndVersion(TENANT_ID, EMPLOYEE_ID, '2026.07.1'),
    ).resolves.toBe(consents);
  });

  it('upsertGrantedConsent persiste metadatos opcionales', async () => {
    const record = { id: 'consent-1', granted: true };
    (prisma.dataConsent.upsert as jest.Mock).mockResolvedValue(record);

    const result = await repository.upsertGrantedConsent({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      consentType: ConsentType.GEOLOCALIZACION,
      policyVersion: '2026.07.1',
      ipAddress: '127.0.0.1',
      deviceId: 'device-1',
    });

    expect(prisma.dataConsent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          granted: true,
          ipAddress: '127.0.0.1',
          deviceId: 'device-1',
        }),
        create: expect.objectContaining({
          tenantId: TENANT_ID,
          employeeId: EMPLOYEE_ID,
          consentType: ConsentType.GEOLOCALIZACION,
        }),
      }),
    );
    expect(result).toBe(record);
  });

  it('revokeConsent actualiza registro existente', async () => {
    const existing = { id: 'consent-1' };
    const revoked = { id: 'consent-1', granted: false };
    (prisma.dataConsent.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.dataConsent.update as jest.Mock).mockResolvedValue(revoked);

    const result = await repository.revokeConsent({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      consentType: ConsentType.BIOMETRICO_FACIAL,
      policyVersion: '2026.07.1',
    });

    expect(prisma.dataConsent.update).toHaveBeenCalledWith({
      where: { id: 'consent-1' },
      data: expect.objectContaining({ granted: false, revokedAt: expect.any(Date) }),
    });
    expect(result).toBe(revoked);
  });

  it('revokeConsent crea registro revocado cuando no existe', async () => {
    const created = { id: 'consent-new', granted: false };
    (prisma.dataConsent.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.dataConsent.create as jest.Mock).mockResolvedValue(created);

    const result = await repository.revokeConsent({
      tenantId: TENANT_ID,
      employeeId: EMPLOYEE_ID,
      consentType: ConsentType.GEOLOCALIZACION,
      policyVersion: '2026.07.1',
    });

    expect(prisma.dataConsent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        consentType: ConsentType.GEOLOCALIZACION,
        granted: false,
        grantedAt: null,
        revokedAt: expect.any(Date),
      }),
    });
    expect(result).toBe(created);
  });

  it('publishPolicy desactiva políticas previas y hace upsert en transacción', async () => {
    const published = { id: 'policy-2', version: '2026.08.1', isActive: true };
    const tx = {
      dataProcessingPolicy: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        upsert: jest.fn().mockResolvedValue(published),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx));

    const result = await repository.publishPolicy(TENANT_ID, {
      version: '2026.08.1',
      title: 'Nueva política',
      content: 'Texto',
      consentLabel: 'Acepto',
    });

    expect(tx.dataProcessingPolicy.updateMany).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID, isActive: true, deletedAt: null },
      data: { isActive: false },
    });
    expect(tx.dataProcessingPolicy.upsert).toHaveBeenCalled();
    expect(result).toBe(published);
  });
});
