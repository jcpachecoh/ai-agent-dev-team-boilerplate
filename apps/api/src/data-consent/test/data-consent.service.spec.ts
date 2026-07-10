import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, ConsentType } from '@prisma/client';
import { AuditService } from '../../audit/service/audit.service';
import { DataConsentRepository } from '../repository/data-consent.repository';
import { DataConsentService } from '../service/data-consent.service';

describe('DataConsentService', () => {
  let service: DataConsentService;
  let repository: jest.Mocked<DataConsentRepository>;
  let auditService: jest.Mocked<AuditService>;

  const TENANT_ID = 'palos-de-lena';
  const USER_ID = 'user-001';
  const EMPLOYEE_ID = 'emp-001';

  const policy = {
    id: 'policy-1',
    tenantId: TENANT_ID,
    version: '2026.07.1',
    title: 'Política',
    content: 'Texto legal',
    consentLabel: 'Acepto',
    publishedAt: new Date('2026-07-01'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const actor = {
    userId: USER_ID,
    tenantId: TENANT_ID,
    roleCode: 'OPERATOR',
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
  };

  const employee = {
    id: EMPLOYEE_ID,
    pinHash: 'pin-hash',
    photoStorageObjectId: null as string | null,
    personalData: null as { profilePhotoStorageObjectId: string | null } | null,
  };

  beforeEach(async () => {
    repository = {
      findEmployeeByUserId: jest.fn(),
      findActivePolicy: jest.fn(),
      findPoliciesByTenant: jest.fn(),
      findConsentsByEmployeeAndVersion: jest.fn(),
      upsertGrantedConsent: jest.fn(),
      revokeConsent: jest.fn(),
      publishPolicy: jest.fn(),
    } as unknown as jest.Mocked<DataConsentRepository>;

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataConsentService,
        { provide: DataConsentRepository, useValue: repository },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(DataConsentService);
  });

  describe('getActivePolicy', () => {
    it('lanza NotFoundException cuando no hay política vigente', async () => {
      repository.findActivePolicy.mockResolvedValue(null);

      await expect(service.getActivePolicy(TENANT_ID)).rejects.toThrow(NotFoundException);
    });

    it('devuelve la política activa del tenant', async () => {
      repository.findActivePolicy.mockResolvedValue(policy);

      await expect(service.getActivePolicy(TENANT_ID)).resolves.toEqual(policy);
    });
  });

  describe('listPolicies', () => {
    it('delega al repositorio por tenant', async () => {
      repository.findPoliciesByTenant.mockResolvedValue([policy]);

      await expect(service.listPolicies(TENANT_ID)).resolves.toEqual([policy]);
      expect(repository.findPoliciesByTenant).toHaveBeenCalledWith(TENANT_ID);
    });
  });

  describe('grantConsent', () => {
    it('rechaza cuando accepted es false', async () => {
      await expect(
        service.grantConsent(
          { userId: USER_ID, tenantId: TENANT_ID, roleCode: 'OPERATOR' },
          {
            policyVersion: policy.version,
            consentTypes: [ConsentType.GEOLOCALIZACION],
            accepted: false,
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza cuando no hay tipos de consentimiento', async () => {
      await expect(
        service.grantConsent(actor, {
          policyVersion: policy.version,
          consentTypes: [],
          accepted: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza cuando la versión de política no coincide', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(employee);
      repository.findActivePolicy.mockResolvedValue(policy);

      await expect(
        service.grantConsent(actor, {
          policyVersion: '2026.01.1',
          consentTypes: [ConsentType.GEOLOCALIZACION],
          accepted: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('otorga consentimiento y registra auditoría', async () => {
      repository.findEmployeeByUserId.mockResolvedValue({
        id: EMPLOYEE_ID,
        pinHash: 'hash',
        photoStorageObjectId: null,
        personalData: null,
      });
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.upsertGrantedConsent.mockResolvedValue({
        id: 'consent-1',
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        consentType: ConsentType.BIOMETRICO_FACIAL,
        granted: true,
        policyVersion: policy.version,
        grantedAt: new Date(),
        revokedAt: null,
        ipAddress: '127.0.0.1',
        deviceId: 'device-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.grantConsent(
        {
          userId: USER_ID,
          tenantId: TENANT_ID,
          roleCode: 'OPERATOR',
          ipAddress: '127.0.0.1',
        },
        {
          policyVersion: policy.version,
          consentTypes: [ConsentType.BIOMETRICO_FACIAL],
          accepted: true,
          deviceId: 'device-1',
        },
      );

      expect(result).toHaveLength(1);
      expect(repository.upsertGrantedConsent).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          entityType: 'DataConsent',
        }),
      );
    });

    it('deduplica tipos de consentimiento repetidos', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(employee);
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.upsertGrantedConsent.mockResolvedValue({
        id: 'consent-1',
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        consentType: ConsentType.GEOLOCALIZACION,
        granted: true,
        policyVersion: policy.version,
        grantedAt: new Date(),
        revokedAt: null,
        ipAddress: null,
        deviceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.grantConsent(actor, {
        policyVersion: policy.version,
        consentTypes: [ConsentType.GEOLOCALIZACION, ConsentType.GEOLOCALIZACION],
        accepted: true,
      });

      expect(result).toHaveLength(1);
      expect(repository.upsertGrantedConsent).toHaveBeenCalledTimes(1);
    });
  });

  describe('revokeConsent', () => {
    it('revoca consentimiento y registra auditoría', async () => {
      const revokedRecord = {
        id: 'consent-1',
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        consentType: ConsentType.BIOMETRICO_FACIAL,
        granted: false,
        policyVersion: policy.version,
        grantedAt: new Date(),
        revokedAt: new Date(),
        ipAddress: '127.0.0.1',
        deviceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findEmployeeByUserId.mockResolvedValue(employee);
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.revokeConsent.mockResolvedValue(revokedRecord);

      const result = await service.revokeConsent(actor, {
        consentType: ConsentType.BIOMETRICO_FACIAL,
      });

      expect(result).toEqual(revokedRecord);
      expect(repository.revokeConsent).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        consentType: ConsentType.BIOMETRICO_FACIAL,
        policyVersion: policy.version,
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          entityType: 'DataConsent',
        }),
      );
    });

    it('registra revokedAt nulo en auditoría cuando el repositorio no lo devuelve', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(employee);
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.revokeConsent.mockResolvedValue({
        id: 'consent-1',
        tenantId: TENANT_ID,
        employeeId: EMPLOYEE_ID,
        consentType: ConsentType.GEOLOCALIZACION,
        granted: false,
        policyVersion: policy.version,
        grantedAt: new Date(),
        revokedAt: null,
        ipAddress: null,
        deviceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.revokeConsent(actor, { consentType: ConsentType.GEOLOCALIZACION });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          newValue: expect.objectContaining({ revokedAt: null }),
        }),
      );
    });
  });

  describe('publishPolicy', () => {
    const publishInput = {
      version: '2026.08.1',
      title: 'Nueva política',
      content: 'Texto actualizado',
      consentLabel: 'Acepto el tratamiento',
    };

    it('bloquea publicación sin rol de SuperAdmin', async () => {
      await expect(service.publishPolicy(actor, publishInput)).rejects.toThrow(ForbiddenException);
    });

    it('publica política y registra auditoría para SuperAdmin', async () => {
      const publishedPolicy = { ...policy, ...publishInput, id: 'policy-2' };
      repository.publishPolicy.mockResolvedValue(publishedPolicy);

      const result = await service.publishPolicy(
        { ...actor, roleCode: 'SUPER_ADMIN' },
        publishInput,
      );

      expect(result).toEqual(publishedPolicy);
      expect(repository.publishPolicy).toHaveBeenCalledWith(TENANT_ID, publishInput);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          entityType: 'DataProcessingPolicy',
        }),
      );
    });

    it('publica política para OWNER', async () => {
      const publishedPolicy = { ...policy, ...publishInput, id: 'policy-3' };
      repository.publishPolicy.mockResolvedValue(publishedPolicy);

      await expect(
        service.publishPolicy({ ...actor, roleCode: 'OWNER' }, publishInput),
      ).resolves.toEqual(publishedPolicy);
    });
  });

  describe('assertConsentForFeature', () => {
    it('lanza NotFoundException cuando el empleado no existe', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(null);

      await expect(
        service.assertConsentForFeature({
          userId: USER_ID,
          tenantId: TENANT_ID,
          consentType: ConsentType.GEOLOCALIZACION,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException cuando no hay política vigente', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(employee);
      repository.findActivePolicy.mockResolvedValue(null);

      await expect(
        service.assertConsentForFeature({
          userId: USER_ID,
          tenantId: TENANT_ID,
          consentType: ConsentType.GEOLOCALIZACION,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('no lanza cuando existe consentimiento activo', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(employee);
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.findConsentsByEmployeeAndVersion.mockResolvedValue([
        {
          id: 'c1',
          tenantId: TENANT_ID,
          employeeId: EMPLOYEE_ID,
          consentType: ConsentType.GEOLOCALIZACION,
          granted: true,
          policyVersion: policy.version,
          grantedAt: new Date(),
          revokedAt: null,
          ipAddress: null,
          deviceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await expect(
        service.assertConsentForFeature({
          userId: USER_ID,
          tenantId: TENANT_ID,
          consentType: ConsentType.GEOLOCALIZACION,
        }),
      ).resolves.toBeUndefined();
    });

    it('lanza ForbiddenException cuando el consentimiento está revocado', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(employee);
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.findConsentsByEmployeeAndVersion.mockResolvedValue([
        {
          id: 'c1',
          tenantId: TENANT_ID,
          employeeId: EMPLOYEE_ID,
          consentType: ConsentType.GEOLOCALIZACION,
          granted: true,
          policyVersion: policy.version,
          grantedAt: new Date(),
          revokedAt: new Date(),
          ipAddress: null,
          deviceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await expect(
        service.assertConsentForFeature({
          userId: USER_ID,
          tenantId: TENANT_ID,
          consentType: ConsentType.GEOLOCALIZACION,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza ForbiddenException cuando no hay consentimiento vigente', async () => {
      repository.findEmployeeByUserId.mockResolvedValue({
        id: EMPLOYEE_ID,
        pinHash: 'pin-hash',
        photoStorageObjectId: null,
        personalData: null,
      });
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.findConsentsByEmployeeAndVersion.mockResolvedValue([]);

      await expect(
        service.assertConsentForFeature({
          userId: USER_ID,
          tenantId: TENANT_ID,
          consentType: ConsentType.GEOLOCALIZACION,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('buildConsentRequiredError', () => {
    it('indica método alterno cuando el empleado tiene PIN', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(employee);

      await expect(
        service.buildConsentRequiredError(USER_ID, TENANT_ID, ConsentType.BIOMETRICO_FACIAL),
      ).resolves.toEqual(
        expect.objectContaining({
          code: 'CONSENT_REQUIRED',
          consentType: ConsentType.BIOMETRICO_FACIAL,
          alternateMethodAvailable: true,
        }),
      );
    });

    it('indica que no hay método alterno cuando el empleado no existe', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(null);

      await expect(
        service.buildConsentRequiredError(USER_ID, TENANT_ID, ConsentType.GEOLOCALIZACION),
      ).resolves.toEqual(
        expect.objectContaining({
          alternateMethodAvailable: false,
        }),
      );
    });

    it('indica que no hay método alterno cuando el empleado no tiene PIN', async () => {
      repository.findEmployeeByUserId.mockResolvedValue({
        ...employee,
        pinHash: null,
      });

      await expect(
        service.buildConsentRequiredError(USER_ID, TENANT_ID, ConsentType.GEOLOCALIZACION),
      ).resolves.toEqual(
        expect.objectContaining({
          alternateMethodAvailable: false,
        }),
      );
    });
  });

  describe('getMyConsentStatus', () => {
    it('devuelve resumen con método alterno cuando hay pinHash', async () => {
      repository.findEmployeeByUserId.mockResolvedValue({
        id: EMPLOYEE_ID,
        pinHash: 'pin-hash',
        photoStorageObjectId: 'photo-1',
        personalData: null,
      });
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.findConsentsByEmployeeAndVersion.mockResolvedValue([
        {
          id: 'c1',
          tenantId: TENANT_ID,
          employeeId: EMPLOYEE_ID,
          consentType: ConsentType.GEOLOCALIZACION,
          granted: true,
          policyVersion: policy.version,
          grantedAt: new Date(),
          revokedAt: null,
          ipAddress: null,
          deviceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const summary = await service.getMyConsentStatus(USER_ID, TENANT_ID);

      expect(summary.alternateMethodAvailable).toBe(true);
      expect(summary.biometricEnrolled).toBe(true);
      expect(summary.consents).toHaveLength(2);
    });

    it('marca consentimiento revocado y usa foto de datos personales', async () => {
      repository.findEmployeeByUserId.mockResolvedValue({
        id: EMPLOYEE_ID,
        pinHash: null,
        photoStorageObjectId: null,
        personalData: { profilePhotoStorageObjectId: 'profile-photo-1' },
      });
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.findConsentsByEmployeeAndVersion.mockResolvedValue([
        {
          id: 'c1',
          tenantId: TENANT_ID,
          employeeId: EMPLOYEE_ID,
          consentType: ConsentType.BIOMETRICO_FACIAL,
          granted: true,
          policyVersion: policy.version,
          grantedAt: new Date(),
          revokedAt: new Date(),
          ipAddress: null,
          deviceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const summary = await service.getMyConsentStatus(USER_ID, TENANT_ID);

      expect(summary.alternateMethodAvailable).toBe(false);
      expect(summary.biometricEnrolled).toBe(true);
      expect(
        summary.consents.find((row) => row.consentType === ConsentType.BIOMETRICO_FACIAL),
      ).toEqual(expect.objectContaining({ granted: false, canUseFeature: false }));
    });

    it('lanza NotFoundException cuando el empleado no existe', async () => {
      repository.findEmployeeByUserId.mockResolvedValue(null);

      await expect(service.getMyConsentStatus(USER_ID, TENANT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEmployeeConsentStatus', () => {
    it('permite consulta propia sin rol de nómina', async () => {
      repository.findEmployeeByUserId.mockResolvedValue({
        id: EMPLOYEE_ID,
        pinHash: null,
        photoStorageObjectId: null,
        personalData: null,
      });
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.findConsentsByEmployeeAndVersion.mockResolvedValue([]);

      await expect(
        service.getEmployeeConsentStatus(USER_ID, {
          userId: USER_ID,
          tenantId: TENANT_ID,
          roleCode: 'OPERATOR',
        }),
      ).resolves.toBeDefined();
    });

    it('bloquea consulta de otro empleado sin rol de nómina', async () => {
      await expect(
        service.getEmployeeConsentStatus('other-user', {
          userId: USER_ID,
          tenantId: TENANT_ID,
          roleCode: 'OPERATOR',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite consulta de otro empleado con rol de nómina', async () => {
      repository.findEmployeeByUserId.mockResolvedValue({
        id: 'emp-other',
        pinHash: null,
        photoStorageObjectId: null,
        personalData: null,
      });
      repository.findActivePolicy.mockResolvedValue(policy);
      repository.findConsentsByEmployeeAndVersion.mockResolvedValue([]);

      await expect(
        service.getEmployeeConsentStatus('other-user', {
          userId: USER_ID,
          tenantId: TENANT_ID,
          roleCode: 'NOMINA',
        }),
      ).resolves.toBeDefined();
    });
  });
});
