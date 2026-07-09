import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VacationStatus, VacationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { RolesGuard } from '../../common/guards/roles.guard';
import { VacationsController } from '../controller/vacations.controller';
import { VacationsService } from '../service/vacations.service';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';
const EMPLOYEE_ID = 'emp-1';
const REQUEST_ID = 'req-1';

const jwtUser = {
  sub: USER_ID,
  email: 'owner@test.dev',
  tenantId: TENANT_ID,
  roleId: 'role-1',
  roleCode: 'OWNER',
};

const balanceRecord = {
  id: 'bal-1',
  tenantId: TENANT_ID,
  employeeId: EMPLOYEE_ID,
  accruedDays: new Decimal(15),
  takenDays: new Decimal(0),
  compensatedDays: new Decimal(0),
  lastAccrualDate: new Date('2026-06-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const requestRecord = {
  id: REQUEST_ID,
  tenantId: TENANT_ID,
  employeeId: EMPLOYEE_ID,
  startDate: new Date('2026-07-01'),
  endDate: new Date('2026-07-15'),
  daysRequested: new Decimal(15),
  type: VacationType.DISFRUTE,
  status: VacationStatus.SOLICITADA,
  level1ApprovedBy: null,
  level1ActedAt: null,
  level2ApprovedBy: null,
  level2ActedAt: null,
  rejectionReason: null,
  letterStorageObjectId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('VacationsController', () => {
  let controller: VacationsController;
  let service: jest.Mocked<VacationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VacationsController],
      providers: [
        {
          provide: VacationsService,
          useValue: {
            assertCanViewEmployee: jest.fn(),
            getBalance: jest.fn(),
            getMyBalance: jest.fn(),
            requestVacation: jest.fn(),
            listRequests: jest.fn(),
            listMyRequests: jest.fn(),
            approveLevel1: jest.fn(),
            approveLevel2: jest.fn(),
            reject: jest.fn(),
            getLetterUrl: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(VacationsController);
    service = module.get(VacationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getBalance', () => {
    it('delega al service con tenantId del JWT', async () => {
      // Arrange
      service.getBalance.mockResolvedValue(balanceRecord);

      // Act
      const result = await controller.getBalance(jwtUser, EMPLOYEE_ID);

      // Assert
      expect(service.assertCanViewEmployee).toHaveBeenCalledWith(TENANT_ID, USER_ID, EMPLOYEE_ID);
      expect(service.getBalance).toHaveBeenCalledWith(TENANT_ID, EMPLOYEE_ID);
      expect(result.availableDays).toBe(15);
    });
  });

  describe('getMyBalance', () => {
    it('delega al service con el usuario autenticado', async () => {
      service.getMyBalance.mockResolvedValue(balanceRecord);

      const result = await controller.getMyBalance(jwtUser);

      expect(service.getMyBalance).toHaveBeenCalledWith(TENANT_ID, USER_ID);
      expect(result.employeeId).toBe(EMPLOYEE_ID);
    });
  });

  describe('listMyRequests', () => {
    it('lista solicitudes propias sin employeeId en query', async () => {
      service.listMyRequests.mockResolvedValue([
        {
          ...requestRecord,
          employeeName: 'Operario',
          locationId: 'loc-1',
          locationName: 'PL-01',
        },
      ]);

      const result = await controller.listMyRequests(jwtUser, { take: 20 });

      expect(service.listMyRequests).toHaveBeenCalledWith(
        TENANT_ID,
        USER_ID,
        expect.objectContaining({ take: 20 }),
      );
      expect(result[0]?.employeeName).toBe('Operario');
    });
  });

  describe('createRequest', () => {
    it('crea solicitud sin tenantId en body', async () => {
      // Arrange
      service.requestVacation.mockResolvedValue(requestRecord);

      // Act
      const result = await controller.createRequest(jwtUser, {
        employeeId: EMPLOYEE_ID,
        startDate: '2026-07-01',
        endDate: '2026-07-15',
        type: VacationType.DISFRUTE,
      });

      // Assert
      expect(service.requestVacation).toHaveBeenCalledWith(
        TENANT_ID,
        USER_ID,
        expect.objectContaining({
          employeeId: EMPLOYEE_ID,
          type: VacationType.DISFRUTE,
        }),
      );
      expect(result.status).toBe(VacationStatus.SOLICITADA);
    });
  });

  describe('listRequests', () => {
    it('lista con tenantId del JWT', async () => {
      // Arrange
      service.listRequests.mockResolvedValue([
        {
          ...requestRecord,
          employeeName: 'Ana',
          locationId: 'loc-1',
          locationName: 'Sede',
        },
      ]);

      // Act
      const result = await controller.listRequests(jwtUser, { take: 20 });

      // Assert
      expect(service.listRequests).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({ take: 20 }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].employeeName).toBe('Ana');
    });
  });

  describe('approveLevel1', () => {
    it('aprueba nivel 1 con tenantId del JWT', async () => {
      // Arrange
      service.approveLevel1.mockResolvedValue({
        ...requestRecord,
        status: VacationStatus.APROBADA_NIVEL_1,
      });

      // Act
      const result = await controller.approveLevel1(jwtUser, REQUEST_ID);

      // Assert
      expect(service.approveLevel1).toHaveBeenCalledWith(TENANT_ID, USER_ID, REQUEST_ID);
      expect(result.status).toBe(VacationStatus.APROBADA_NIVEL_1);
    });
  });

  describe('approveLevel2', () => {
    it('aprueba nivel 2 con tenantId del JWT', async () => {
      // Arrange
      service.approveLevel2.mockResolvedValue({
        ...requestRecord,
        status: VacationStatus.APROBADA,
        letterStorageObjectId: 'storage-1',
      });

      // Act
      const result = await controller.approveLevel2(jwtUser, REQUEST_ID);

      // Assert
      expect(service.approveLevel2).toHaveBeenCalledWith(TENANT_ID, USER_ID, REQUEST_ID);
      expect(result.status).toBe(VacationStatus.APROBADA);
    });
  });

  describe('reject', () => {
    it('rechaza con motivo obligatorio', async () => {
      // Arrange
      service.reject.mockResolvedValue({
        ...requestRecord,
        status: VacationStatus.RECHAZADA,
        rejectionReason: 'Alta operación',
      });

      // Act
      const result = await controller.reject(jwtUser, REQUEST_ID, {
        rejectionReason: 'Alta operación',
      });

      // Assert
      expect(service.reject).toHaveBeenCalledWith(TENANT_ID, USER_ID, {
        requestId: REQUEST_ID,
        rejectionReason: 'Alta operación',
      });
      expect(result.rejectionReason).toBe('Alta operación');
    });
  });

  describe('getLetterUrl', () => {
    it('retorna URL prefirmada', async () => {
      // Arrange
      service.getLetterUrl.mockResolvedValue('https://signed.example/letter.pdf');

      // Act
      const result = await controller.getLetterUrl(jwtUser, REQUEST_ID);

      // Assert
      expect(service.getLetterUrl).toHaveBeenCalledWith(TENANT_ID, USER_ID, REQUEST_ID);
      expect(result.url).toContain('letter.pdf');
    });

    it('propaga NotFoundException del service', async () => {
      // Arrange
      service.getLetterUrl.mockRejectedValue(new NotFoundException('sin carta'));

      // Act & Assert
      await expect(controller.getLetterUrl(jwtUser, REQUEST_ID)).rejects.toThrow(NotFoundException);
    });

    it('propaga ForbiddenException del service', async () => {
      // Arrange
      service.getLetterUrl.mockRejectedValue(new ForbiddenException());

      // Act & Assert
      await expect(controller.getLetterUrl(jwtUser, REQUEST_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
