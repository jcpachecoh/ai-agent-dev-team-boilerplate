import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LeaveOrigin, LeaveStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { AuthService } from '../../auth/service/auth.service';
import { PayrollRepository } from '../../payroll/repository/payroll.repository';
import { StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import { MedicalLeavesRepository } from '../repository/medical-leaves.repository';
import { MedicalLeavesService } from '../service/medical-leaves.service';

const TENANT = 'tenant-1';
const ACTOR_USER_ID = 'user-nomina';
const EMPLOYEE_ID = 'emp-1';
const LEAVE_ID = 'leave-1';

const mockEmployee = {
  id: EMPLOYEE_ID,
  tenantId: TENANT,
  salaryAmount: new Decimal('3000000'),
  isActive: true,
  deletedAt: null,
};

const mockLeave = {
  id: LEAVE_ID,
  tenantId: TENANT,
  employeeId: EMPLOYEE_ID,
  origin: LeaveOrigin.COMUN,
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-05'),
  totalDays: 5,
  employerPaidDays: 2,
  epsArlPaidDays: 3,
  epsArlAmount: new Decimal('200010.00'),
  employerAmount: new Decimal('200000.00'),
  supportStorageObjectId: null,
  status: LeaveStatus.REGISTRADA,
  radicatedAt: null,
  recoveredAt: null,
  rejectedAt: null,
  rejectionReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('MedicalLeavesService', () => {
  let service: MedicalLeavesService;
  let repository: jest.Mocked<
    Pick<
      MedicalLeavesRepository,
      | 'create'
      | 'findById'
      | 'update'
      | 'listSummaries'
      | 'sumActiveDaysInCalendarYear'
      | 'softDelete'
    >
  >;
  let payrollRepository: jest.Mocked<Pick<PayrollRepository, 'findById'>>;
  let authService: jest.Mocked<Pick<AuthService, 'me'>>;
  let storageService: jest.Mocked<Pick<StorageService, 'getPresignedUrl' | 'uploadFile'>>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      listSummaries: jest.fn(),
      sumActiveDaysInCalendarYear: jest.fn(),
      softDelete: jest.fn(),
    };
    payrollRepository = { findById: jest.fn() };
    authService = { me: jest.fn() };
    storageService = { getPresignedUrl: jest.fn(), uploadFile: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalLeavesService,
        { provide: MedicalLeavesRepository, useValue: repository },
        { provide: PayrollRepository, useValue: payrollRepository },
        { provide: AuthService, useValue: authService },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get(MedicalLeavesService);

    authService.me.mockResolvedValue({
      id: ACTOR_USER_ID,
      tenantId: TENANT,
      email: 'nomina@test.com',
      name: 'RRHH',
      cedula: '123',
      documentType: 'CC',
      emailVerified: true,
      isActive: true,
      roleCode: 'NOMINA',
      createdAt: new Date(),
    });
    payrollRepository.findById.mockResolvedValue(mockEmployee as never);
    repository.listSummaries.mockResolvedValue([]);
    repository.create.mockResolvedValue(mockLeave);
    repository.sumActiveDaysInCalendarYear.mockResolvedValue(5);
    repository.findById.mockResolvedValue(mockLeave);
  });

  describe('register', () => {
    it('calculates payment split and persists without manual amounts', async () => {
      // Arrange
      const input = {
        employeeId: EMPLOYEE_ID,
        origin: LeaveOrigin.COMUN,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-05'),
      };

      // Act
      const result = await service.register(TENANT, ACTOR_USER_ID, input);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({
          employeeId: EMPLOYEE_ID,
          totalDays: 5,
          employerPaidDays: 2,
          epsArlPaidDays: 3,
          status: LeaveStatus.REGISTRADA,
        }),
      );
      expect(result.annualAccumulatedDays).toBe(5);
      expect(result.exceeds180DayThreshold).toBe(false);
    });

    it('flags annual threshold when employee had 170 days and registers 15 more', async () => {
      repository.sumActiveDaysInCalendarYear.mockResolvedValue(185);
      repository.create.mockResolvedValue({
        ...mockLeave,
        totalDays: 15,
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-15T00:00:00.000Z'),
      });

      const result = await service.register(TENANT, ACTOR_USER_ID, {
        employeeId: EMPLOYEE_ID,
        origin: LeaveOrigin.COMUN,
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-15T00:00:00.000Z'),
      });

      expect(result.annualAccumulatedDays).toBe(185);
      expect(result.exceeds180DayThreshold).toBe(true);
      expect(repository.sumActiveDaysInCalendarYear).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        2026,
      );
    });

    it('does not flag threshold when employee has 50 accumulated days', async () => {
      repository.sumActiveDaysInCalendarYear.mockResolvedValue(50);

      const result = await service.register(TENANT, ACTOR_USER_ID, {
        employeeId: EMPLOYEE_ID,
        origin: LeaveOrigin.COMUN,
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: new Date('2026-03-05T00:00:00.000Z'),
      });

      expect(result.annualAccumulatedDays).toBe(50);
      expect(result.exceeds180DayThreshold).toBe(false);
    });

    it('flags annual threshold when accumulated days reach 180', async () => {
      repository.sumActiveDaysInCalendarYear.mockResolvedValue(180);

      const result = await service.register(TENANT, ACTOR_USER_ID, {
        employeeId: EMPLOYEE_ID,
        origin: LeaveOrigin.COMUN,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-05'),
      });

      expect(result.exceeds180DayThreshold).toBe(true);
    });

    it('throws NotFoundException when employee does not belong to tenant', async () => {
      payrollRepository.findById.mockResolvedValue(null);

      await expect(
        service.register(TENANT, ACTOR_USER_ID, {
          employeeId: EMPLOYEE_ID,
          origin: LeaveOrigin.COMUN,
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-05'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when start date is after end date', async () => {
      await expect(
        service.register(TENANT, ACTOR_USER_ID, {
          employeeId: EMPLOYEE_ID,
          origin: LeaveOrigin.COMUN,
          startDate: new Date('2026-03-10'),
          endDate: new Date('2026-03-01'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException for exact duplicate active leave', async () => {
      repository.listSummaries.mockResolvedValue([
        {
          ...mockLeave,
          employeeName: 'Ana',
          locationId: 'loc-1',
          locationName: 'Norte',
        },
      ]);

      await expect(
        service.register(TENANT, ACTOR_USER_ID, {
          employeeId: EMPLOYEE_ID,
          origin: LeaveOrigin.COMUN,
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-05'),
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ForbiddenException when actor is not NOMINA', async () => {
      authService.me.mockResolvedValue({
        id: 'user-operator',
        tenantId: TENANT,
        email: 'op@test.com',
        name: 'Operador',
        cedula: '456',
        documentType: 'CC',
        emailVerified: true,
        isActive: true,
        roleCode: 'OPERATOR',
        createdAt: new Date(),
      });

      await expect(
        service.register(TENANT, 'user-operator', {
          employeeId: EMPLOYEE_ID,
          origin: LeaveOrigin.COMUN,
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-05'),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when actor belongs to another tenant', async () => {
      authService.me.mockResolvedValue({
        id: ACTOR_USER_ID,
        tenantId: 'other-tenant',
        email: 'nomina@test.com',
        name: 'RRHH',
        cedula: '123',
        documentType: 'CC',
        emailVerified: true,
        isActive: true,
        roleCode: 'NOMINA',
        createdAt: new Date(),
      });

      await expect(
        service.register(TENANT, ACTOR_USER_ID, {
          employeeId: EMPLOYEE_ID,
          origin: LeaveOrigin.COMUN,
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-05'),
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('transitions REGISTRADA to RADICADA_EPS and sets radicatedAt when support is attached', async () => {
      const radicatedAt = new Date('2026-03-06');
      jest.useFakeTimers();
      jest.setSystemTime(radicatedAt);
      repository.findById.mockResolvedValue({
        ...mockLeave,
        supportStorageObjectId: 'storage-1',
      });
      repository.update.mockResolvedValue({
        ...mockLeave,
        supportStorageObjectId: 'storage-1',
        status: LeaveStatus.RADICADA_EPS,
        radicatedAt,
      });

      const result = await service.updateStatus(TENANT, ACTOR_USER_ID, LEAVE_ID, {
        status: LeaveStatus.RADICADA_EPS,
      });

      expect(repository.update).toHaveBeenCalledWith(TENANT, LEAVE_ID, {
        status: LeaveStatus.RADICADA_EPS,
        radicatedAt,
      });
      expect(result.status).toBe(LeaveStatus.RADICADA_EPS);
      jest.useRealTimers();
    });

    it('requires support document before transitioning to RADICADA_EPS', async () => {
      await expect(
        service.updateStatus(TENANT, ACTOR_USER_ID, LEAVE_ID, {
          status: LeaveStatus.RADICADA_EPS,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('transitions RADICADA_EPS to RECOBRADA and sets recoveredAt', async () => {
      const recoveredAt = new Date('2026-03-20');
      jest.useFakeTimers();
      jest.setSystemTime(recoveredAt);
      repository.findById.mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.RADICADA_EPS,
      });
      repository.update.mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.RECOBRADA,
        recoveredAt,
      });

      const result = await service.updateStatus(TENANT, ACTOR_USER_ID, LEAVE_ID, {
        status: LeaveStatus.RECOBRADA,
      });

      expect(repository.update).toHaveBeenCalledWith(TENANT, LEAVE_ID, {
        status: LeaveStatus.RECOBRADA,
        recoveredAt,
      });
      expect(result.status).toBe(LeaveStatus.RECOBRADA);
      jest.useRealTimers();
    });

    it('transitions to RECHAZADA with rejection reason and rejectedAt', async () => {
      const rejectedAt = new Date('2026-03-07');
      jest.useFakeTimers();
      jest.setSystemTime(rejectedAt);
      repository.update.mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.RECHAZADA,
        rejectedAt,
        rejectionReason: 'Documentación incompleta',
      });

      const result = await service.updateStatus(TENANT, ACTOR_USER_ID, LEAVE_ID, {
        status: LeaveStatus.RECHAZADA,
        rejectionReason: 'Documentación incompleta',
      });

      expect(repository.update).toHaveBeenCalledWith(TENANT, LEAVE_ID, {
        status: LeaveStatus.RECHAZADA,
        rejectedAt,
        rejectionReason: 'Documentación incompleta',
      });
      expect(result.rejectionReason).toBe('Documentación incompleta');
      jest.useRealTimers();
    });

    it('requires rejectionReason when rejecting', async () => {
      await expect(
        service.updateStatus(TENANT, ACTOR_USER_ID, LEAVE_ID, {
          status: LeaveStatus.RECHAZADA,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid transition', async () => {
      repository.findById.mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.RECOBRADA,
      });

      await expect(
        service.updateStatus(TENANT, ACTOR_USER_ID, LEAVE_ID, {
          status: LeaveStatus.RADICADA_EPS,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when leave does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus(TENANT, ACTOR_USER_ID, 'missing', {
          status: LeaveStatus.RADICADA_EPS,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('delegates to repository listSummaries', async () => {
      repository.listSummaries.mockResolvedValue([
        {
          ...mockLeave,
          employeeName: 'Ana',
          locationId: 'loc-1',
          locationName: 'Norte',
        },
      ]);

      const result = await service.list(TENANT, { employeeId: EMPLOYEE_ID });

      expect(repository.listSummaries).toHaveBeenCalledWith(TENANT, {
        employeeId: EMPLOYEE_ID,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('returns exceeds180DayThreshold true when annual accumulated days are 185', async () => {
      repository.sumActiveDaysInCalendarYear.mockResolvedValue(185);

      const result = await service.getById(TENANT, LEAVE_ID);

      expect(result.exceeds180DayThreshold).toBe(true);
      expect(result.annualAccumulatedDays).toBe(185);
      expect(repository.sumActiveDaysInCalendarYear).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        mockLeave.startDate.getUTCFullYear(),
      );
    });

    it('returns exceeds180DayThreshold false when annual accumulated days are 50', async () => {
      repository.sumActiveDaysInCalendarYear.mockResolvedValue(50);

      const result = await service.getById(TENANT, LEAVE_ID);

      expect(result.exceeds180DayThreshold).toBe(false);
      expect(result.annualAccumulatedDays).toBe(50);
    });
  });

  describe('softDelete', () => {
    it('delegates to repository after validating permissions and leave', async () => {
      repository.softDelete.mockResolvedValue({
        ...mockLeave,
        deletedAt: new Date('2026-03-15'),
      });

      const result = await service.softDelete(TENANT, ACTOR_USER_ID, LEAVE_ID);

      expect(repository.softDelete).toHaveBeenCalledWith(TENANT, LEAVE_ID);
      expect(result.deletedAt).not.toBeNull();
    });
  });

  describe('getAnnualAccumulatedDays', () => {
    it('delegates to repository after validating employee', async () => {
      repository.sumActiveDaysInCalendarYear.mockResolvedValue(42);

      const result = await service.getAnnualAccumulatedDays(TENANT, EMPLOYEE_ID, 2026);

      expect(payrollRepository.findById).toHaveBeenCalledWith(EMPLOYEE_ID);
      expect(repository.sumActiveDaysInCalendarYear).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        2026,
      );
      expect(result).toBe(42);
    });
  });

  describe('attachSupportDocument', () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 medical-leave-support');

    it('uploads support document to payroll storage and links it to the leave', async () => {
      storageService.uploadFile.mockResolvedValue({ id: 'storage-1' } as never);
      repository.update.mockResolvedValue({
        ...mockLeave,
        supportStorageObjectId: 'storage-1',
      });

      const result = await service.attachSupportDocument(TENANT, ACTOR_USER_ID, LEAVE_ID, {
        buffer: pdfBuffer,
        mimetype: 'application/pdf',
        originalname: 'incapacidad.pdf',
        size: pdfBuffer.length,
      });

      expect(storageService.uploadFile).toHaveBeenCalledWith({
        tenantId: TENANT,
        uploadedBy: ACTOR_USER_ID,
        domain: StorageDomain.PAYROLL,
        entityType: 'MedicalLeave',
        entityId: LEAVE_ID,
        visibility: StorageVisibility.PRIVATE,
        file: {
          buffer: pdfBuffer,
          mimetype: 'application/pdf',
          originalname: 'incapacidad.pdf',
          size: pdfBuffer.length,
        },
      });
      expect(repository.update).toHaveBeenCalledWith(TENANT, LEAVE_ID, {
        supportStorageObjectId: 'storage-1',
      });
      expect(result.supportStorageObjectId).toBe('storage-1');
    });

    it('rejects unsupported mime types', async () => {
      await expect(
        service.attachSupportDocument(TENANT, ACTOR_USER_ID, LEAVE_ID, {
          buffer: Buffer.from('plain-text'),
          mimetype: 'text/plain',
          originalname: 'doc.txt',
          size: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects files larger than 10 MB', async () => {
      await expect(
        service.attachSupportDocument(TENANT, ACTOR_USER_ID, LEAVE_ID, {
          buffer: pdfBuffer,
          mimetype: 'application/pdf',
          originalname: 'incapacidad.pdf',
          size: 10 * 1024 * 1024 + 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when file content does not match declared mime type', async () => {
      await expect(
        service.attachSupportDocument(TENANT, ACTOR_USER_ID, LEAVE_ID, {
          buffer: Buffer.from('not-a-real-pdf'),
          mimetype: 'application/pdf',
          originalname: 'incapacidad.pdf',
          size: 14,
        }),
      ).rejects.toThrow('El contenido del archivo no coincide con su tipo declarado');
    });
  });

  describe('getSupportDocumentUrl', () => {
    it('returns presigned url when support document exists', async () => {
      repository.findById.mockResolvedValue({
        ...mockLeave,
        supportStorageObjectId: 'storage-1',
      });
      storageService.getPresignedUrl.mockResolvedValue('https://signed.example/doc.pdf');

      const result = await service.getSupportDocumentUrl(TENANT, LEAVE_ID);

      expect(storageService.getPresignedUrl).toHaveBeenCalledWith('storage-1', TENANT, 900);
      expect(result).toBe('https://signed.example/doc.pdf');
    });

    it('throws NotFoundException when support document is missing', async () => {
      await expect(service.getSupportDocumentUrl(TENANT, LEAVE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
