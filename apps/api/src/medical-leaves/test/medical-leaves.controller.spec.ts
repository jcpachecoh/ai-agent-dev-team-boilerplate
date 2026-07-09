import { LeaveOrigin, LeaveStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Test, TestingModule } from '@nestjs/testing';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MedicalLeavesController } from '../controller/medical-leaves.controller';
import { MedicalLeavesService } from '../service/medical-leaves.service';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-nomina';
const LEAVE_ID = 'leave-1';

const mockUser: JwtPayload = {
  sub: USER_ID,
  email: 'nomina@test.com',
  tenantId: TENANT_ID,
  roleId: 'role-nomina',
  roleCode: 'NOMINA',
};

const mockLeave = {
  id: LEAVE_ID,
  tenantId: TENANT_ID,
  employeeId: 'emp-1',
  origin: LeaveOrigin.COMUN,
  startDate: new Date('2026-03-01T00:00:00.000Z'),
  endDate: new Date('2026-03-05T00:00:00.000Z'),
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
  createdAt: new Date('2026-03-01T10:00:00.000Z'),
  updatedAt: new Date('2026-03-01T10:00:00.000Z'),
  deletedAt: null,
};

describe('MedicalLeavesController', () => {
  let controller: MedicalLeavesController;
  let service: jest.Mocked<
    Pick<
      MedicalLeavesService,
      | 'register'
      | 'list'
      | 'getById'
      | 'updateStatus'
      | 'attachSupportDocument'
      | 'getSupportDocumentUrl'
      | 'softDelete'
    >
  >;

  beforeEach(async () => {
    service = {
      register: jest.fn(),
      list: jest.fn(),
      getById: jest.fn(),
      updateStatus: jest.fn(),
      attachSupportDocument: jest.fn(),
      getSupportDocumentUrl: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalLeavesController],
      providers: [{ provide: MedicalLeavesService, useValue: service }],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(MedicalLeavesController);
  });

  describe('register', () => {
    it('delegates to service with tenantId from JWT', async () => {
      // Arrange
      service.register.mockResolvedValue({
        ...mockLeave,
        annualAccumulatedDays: 5,
        exceeds180DayThreshold: false,
      });

      // Act
      const result = await controller.register(mockUser, {
        employeeId: 'emp-1',
        origin: LeaveOrigin.COMUN,
        startDate: '2026-03-01',
        endDate: '2026-03-05',
      });

      // Assert
      expect(service.register).toHaveBeenCalledWith(
        TENANT_ID,
        USER_ID,
        expect.objectContaining({
          employeeId: 'emp-1',
          origin: LeaveOrigin.COMUN,
        }),
      );
      expect(result.id).toBe(LEAVE_ID);
      expect(result.annualAccumulatedDays).toBe(5);
    });
  });

  describe('list', () => {
    it('passes query filters to service', async () => {
      // Arrange
      service.list.mockResolvedValue([
        {
          ...mockLeave,
          employeeName: 'Ana Pérez',
          locationId: 'loc-1',
          locationName: 'Norte',
        },
      ]);

      // Act
      const result = await controller.list(mockUser, {
        locationId: 'loc-1',
        month: '2026-03',
      });

      // Assert
      expect(service.list).toHaveBeenCalledWith(TENANT_ID, {
        locationId: 'loc-1',
        month: '2026-03',
      });
      expect(result[0]?.employeeName).toBe('Ana Pérez');
    });
  });

  describe('getById', () => {
    it('returns mapped detail with annual threshold fields', async () => {
      // Arrange
      service.getById.mockResolvedValue({
        ...mockLeave,
        annualAccumulatedDays: 180,
        exceeds180DayThreshold: true,
      });

      // Act
      const result = await controller.getById(mockUser, LEAVE_ID);

      // Assert
      expect(service.getById).toHaveBeenCalledWith(TENANT_ID, LEAVE_ID);
      expect(result.exceeds180DayThreshold).toBe(true);
    });
  });

  describe('updateStatus', () => {
    it('delegates status change to service', async () => {
      // Arrange
      service.updateStatus.mockResolvedValue({
        ...mockLeave,
        status: LeaveStatus.RADICADA_EPS,
      });

      // Act
      const result = await controller.updateStatus(mockUser, LEAVE_ID, {
        status: LeaveStatus.RADICADA_EPS,
      });

      // Assert
      expect(service.updateStatus).toHaveBeenCalledWith(TENANT_ID, USER_ID, LEAVE_ID, {
        status: LeaveStatus.RADICADA_EPS,
        rejectionReason: undefined,
      });
      expect(result.status).toBe(LeaveStatus.RADICADA_EPS);
    });
  });

  describe('attachSupportDocument', () => {
    it('uploads file buffer through service', async () => {
      // Arrange
      const file = {
        buffer: Buffer.from('%PDF-test'),
        mimetype: 'application/pdf',
        originalname: 'soporte.pdf',
        size: 9,
      } as Express.Multer.File;
      service.attachSupportDocument.mockResolvedValue({
        ...mockLeave,
        supportStorageObjectId: 'storage-1',
      });

      // Act
      const result = await controller.attachSupportDocument(mockUser, LEAVE_ID, file);

      // Assert
      expect(service.attachSupportDocument).toHaveBeenCalledWith(TENANT_ID, USER_ID, LEAVE_ID, {
        buffer: file.buffer,
        mimetype: 'application/pdf',
        originalname: 'soporte.pdf',
        size: 9,
      });
      expect(result.supportStorageObjectId).toBe('storage-1');
    });
  });

  describe('getSupportDocumentUrl', () => {
    it('returns presigned url from service', async () => {
      // Arrange
      service.getSupportDocumentUrl.mockResolvedValue('https://signed.example/doc.pdf');

      // Act
      const result = await controller.getSupportDocumentUrl(mockUser, LEAVE_ID);

      // Assert
      expect(service.getSupportDocumentUrl).toHaveBeenCalledWith(TENANT_ID, LEAVE_ID);
      expect(result.url).toBe('https://signed.example/doc.pdf');
    });
  });

  describe('softDelete', () => {
    it('delegates soft delete to service', async () => {
      // Arrange
      service.softDelete.mockResolvedValue({
        ...mockLeave,
        deletedAt: new Date('2026-03-15'),
      });

      // Act
      await controller.softDelete(mockUser, LEAVE_ID);

      // Assert
      expect(service.softDelete).toHaveBeenCalledWith(TENANT_ID, USER_ID, LEAVE_ID);
    });
  });

  describe('tenant isolation', () => {
    it('uses tenantId from JWT on register and never from request body', async () => {
      service.register.mockResolvedValue({
        ...mockLeave,
        annualAccumulatedDays: 5,
        exceeds180DayThreshold: false,
      });

      await controller.register(mockUser, {
        employeeId: 'emp-1',
        origin: LeaveOrigin.COMUN,
        startDate: '2026-03-01',
        endDate: '2026-03-05',
      });

      expect(service.register).toHaveBeenCalledWith(
        TENANT_ID,
        USER_ID,
        expect.not.objectContaining({ tenantId: expect.anything() }),
      );
    });

    it('scopes list, detail and mutations to JWT tenantId', async () => {
      service.list.mockResolvedValue([]);
      service.getById.mockResolvedValue({
        ...mockLeave,
        annualAccumulatedDays: 5,
        exceeds180DayThreshold: false,
      });
      service.updateStatus.mockResolvedValue(mockLeave);
      service.getSupportDocumentUrl.mockResolvedValue('https://signed.example/doc.pdf');
      service.softDelete.mockResolvedValue(mockLeave);

      await controller.list(mockUser, { month: '2026-03' });
      await controller.getById(mockUser, LEAVE_ID);
      await controller.updateStatus(mockUser, LEAVE_ID, { status: LeaveStatus.RECHAZADA });
      await controller.getSupportDocumentUrl(mockUser, LEAVE_ID);
      await controller.softDelete(mockUser, LEAVE_ID);

      expect(service.list).toHaveBeenCalledWith(TENANT_ID, { month: '2026-03' });
      expect(service.getById).toHaveBeenCalledWith(TENANT_ID, LEAVE_ID);
      expect(service.updateStatus).toHaveBeenCalledWith(
        TENANT_ID,
        USER_ID,
        LEAVE_ID,
        expect.any(Object),
      );
      expect(service.getSupportDocumentUrl).toHaveBeenCalledWith(TENANT_ID, LEAVE_ID);
      expect(service.softDelete).toHaveBeenCalledWith(TENANT_ID, USER_ID, LEAVE_ID);
    });
  });
});
