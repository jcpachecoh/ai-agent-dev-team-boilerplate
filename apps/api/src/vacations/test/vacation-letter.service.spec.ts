import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VacationStatus, VacationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/service/storage.service';
import { StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import type { VacationRequestRecord } from '../interfaces/vacations.interfaces';
import { VacationsRepository } from '../repository/vacations.repository';
import { VacationLetterService } from '../service/vacation-letter.service';

const TENANT_ID = 'tenant-1';
const REQUEST_ID = 'req-1';
const EMPLOYEE_ID = 'emp-1';

function buildRequest(overrides: Partial<VacationRequestRecord> = {}): VacationRequestRecord {
  return {
    id: REQUEST_ID,
    tenantId: TENANT_ID,
    employeeId: EMPLOYEE_ID,
    startDate: new Date(2026, 5, 30),
    endDate: new Date(2026, 6, 17),
    daysRequested: new Decimal(15),
    type: VacationType.DISFRUTE,
    status: VacationStatus.APROBADA_NIVEL_1,
    level1ApprovedBy: 'user-supervisor',
    level1ActedAt: new Date(),
    level2ApprovedBy: null,
    level2ActedAt: null,
    rejectionReason: null,
    letterStorageObjectId: null,
    isActive: true,
    createdAt: new Date(2026, 4, 10),
    updatedAt: new Date(),
    ...overrides,
  };
}

const mockEmployee = {
  id: EMPLOYEE_ID,
  tenantId: TENANT_ID,
  name: 'Sanchez Huertas Bibiana Alexandra',
  position: 'Cajero',
  hireDate: new Date(2024, 1, 14),
  localidad: 'Bogotá D.C.',
  user: {
    cedula: '53114391',
    email: 'alitody@hotmail.com',
  },
  location: {
    name: 'Sede Principal',
    city: 'Bogotá D.C.',
  },
};

const mockTenant = {
  legalName: 'INVERSIONES LLANES',
  tradeName: 'Palos de Leña',
  name: 'Palos de Leña',
  logoUrl: null,
  city: 'Bogotá D.C.',
  email: 'jefetalentohumano@palosdelena.com',
};

describe('VacationLetterService', () => {
  let service: VacationLetterService;
  let prisma: {
    employeeDetails: { findFirst: jest.Mock };
    tenant: { findFirst: jest.Mock };
  };
  let repository: jest.Mocked<Pick<VacationsRepository, 'updateRequest' | 'findRequestById'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'uploadFile' | 'getPresignedUrl'>>;

  beforeEach(async () => {
    prisma = {
      employeeDetails: { findFirst: jest.fn() },
      tenant: { findFirst: jest.fn() },
    };

    repository = {
      updateRequest: jest.fn(),
      findRequestById: jest.fn(),
    };

    storageService = {
      uploadFile: jest.fn(),
      getPresignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacationLetterService,
        { provide: PrismaService, useValue: prisma },
        { provide: VacationsRepository, useValue: repository },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get(VacationLetterService);

    prisma.employeeDetails.findFirst.mockResolvedValue(mockEmployee);
    prisma.tenant.findFirst.mockResolvedValue(mockTenant);
    storageService.uploadFile.mockResolvedValue({ id: 'storage-letter-1' } as never);
    repository.updateRequest.mockResolvedValue(
      buildRequest({ letterStorageObjectId: 'storage-letter-1' }),
    );
  });

  describe('generateAndStoreLetter', () => {
    it('generates approval PDF for DISFRUTE with zero cash compensation days', async () => {
      // Arrange
      const request = buildRequest({ type: VacationType.DISFRUTE });

      // Act
      const result = await service.generateAndStoreLetter(TENANT_ID, request, 'APPROVAL');

      // Assert
      expect(result.storageObjectId).toBe('storage-letter-1');
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          domain: StorageDomain.PAYROLL,
          entityType: 'VacationRequest',
          entityId: REQUEST_ID,
          visibility: StorageVisibility.PRIVATE,
          file: expect.objectContaining({
            mimetype: 'application/pdf',
            originalname: 'vacaciones-APROBACION-req-1.pdf',
          }),
        }),
      );
      const uploadedBuffer = storageService.uploadFile.mock.calls[0][0].file.buffer as Buffer;
      expect(uploadedBuffer.byteLength).toBeGreaterThan(500);
      expect(repository.updateRequest).toHaveBeenCalledWith(TENANT_ID, REQUEST_ID, {
        letterStorageObjectId: 'storage-letter-1',
      });
    });

    it('generates approval PDF for COMPENSACION with cash compensation days', async () => {
      // Arrange
      const request = buildRequest({
        type: VacationType.COMPENSACION,
        daysRequested: new Decimal(7),
      });

      // Act
      const result = await service.generateAndStoreLetter(TENANT_ID, request, 'APPROVAL');

      // Assert
      expect(result.storageObjectId).toBe('storage-letter-1');
      const uploadedBuffer = storageService.uploadFile.mock.calls[0][0].file.buffer as Buffer;
      expect(uploadedBuffer.byteLength).toBeGreaterThan(500);
    });

    it('generates rejection PDF with rejection reason in context', async () => {
      // Arrange
      const request = buildRequest({ status: VacationStatus.SOLICITADA });

      // Act
      await service.generateAndStoreLetter(TENANT_ID, request, 'REJECTION', {
        rejectionReason: 'No hay cobertura operativa',
      });

      // Assert
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            originalname: 'vacaciones-NEGACION-req-1.pdf',
          }),
        }),
      );
      const uploadedBuffer = storageService.uploadFile.mock.calls[0][0].file.buffer as Buffer;
      expect(uploadedBuffer.byteLength).toBeGreaterThan(500);
    });

    it('throws when employee is not found', async () => {
      // Arrange
      prisma.employeeDetails.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateAndStoreLetter(TENANT_ID, buildRequest(), 'APPROVAL'),
      ).rejects.toThrow(NotFoundException);
      expect(storageService.uploadFile).not.toHaveBeenCalled();
    });

    it('throws when tenant is not found', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);

      await expect(
        service.generateAndStoreLetter(TENANT_ID, buildRequest(), 'APPROVAL'),
      ).rejects.toThrow(NotFoundException);
    });

    it('continues when tenant logo cannot be loaded', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);
      prisma.tenant.findFirst.mockResolvedValue({
        ...mockTenant,
        logoUrl: 'https://logo.example/x.png',
      });
      const warnSpy = jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined);

      await service.generateAndStoreLetter(TENANT_ID, buildRequest(), 'APPROVAL');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No se pudo cargar logo del tenant'),
      );

      fetchMock.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('getLetterPresignedUrl', () => {
    it('returns presigned URL when letter exists', async () => {
      // Arrange
      repository.findRequestById.mockResolvedValue(
        buildRequest({ letterStorageObjectId: 'storage-letter-1' }),
      );
      storageService.getPresignedUrl.mockResolvedValue('https://signed.example/vacation.pdf');

      // Act
      const url = await service.getLetterPresignedUrl(TENANT_ID, REQUEST_ID);

      // Assert
      expect(url).toBe('https://signed.example/vacation.pdf');
      expect(storageService.getPresignedUrl).toHaveBeenCalledWith(
        'storage-letter-1',
        TENANT_ID,
        900,
      );
    });

    it('throws when request has no letter', async () => {
      // Arrange
      repository.findRequestById.mockResolvedValue(buildRequest());

      // Act & Assert
      await expect(service.getLetterPresignedUrl(TENANT_ID, REQUEST_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
