import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeContractType, VacationStatus, VacationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import {
  VACATION_LETTER_SERVICE,
  type IVacationLetterService,
} from '../interfaces/vacations.interfaces';
import { VacationsRepository } from '../repository/vacations.repository';
import { VacationAccrualService } from '../service/vacation-accrual.service';
import { VacationsService } from '../service/vacations.service';

const TENANT = 'tenant-1';
const EMPLOYEE_ID = 'emp-1';
const ACTOR_USER = 'user-actor';
const SUPERVISOR_USER = 'user-supervisor';
const RRHH_USER = 'user-rrhh';

function buildRequest(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'req-1',
    tenantId: TENANT,
    employeeId: EMPLOYEE_ID,
    startDate: new Date(2026, 7, 1),
    endDate: new Date(2026, 7, 5),
    daysRequested: new Decimal(5),
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
    ...overrides,
  };
}

function buildBalance(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'balance-1',
    tenantId: TENANT,
    employeeId: EMPLOYEE_ID,
    accruedDays: new Decimal(15),
    takenDays: new Decimal(0),
    compensatedDays: new Decimal(0),
    lastAccrualDate: new Date(2026, 6, 1),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('VacationsService', () => {
  let service: VacationsService;
  let repository: jest.Mocked<VacationsRepository>;
  let userLocationsService: jest.Mocked<UserLocationsService>;
  let vacationAccrualService: jest.Mocked<VacationAccrualService>;
  let letterService: jest.Mocked<IVacationLetterService>;

  beforeEach(async () => {
    repository = {
      findBalanceByEmployee: jest.fn(),
      upsertBalance: jest.fn(),
      createRequest: jest.fn(),
      findRequestById: jest.fn(),
      updateRequest: jest.fn(),
      listRequests: jest.fn(),
      listRequestSummaries: jest.fn(),
      findApprovedDisfruteRanges: jest.fn(),
      findApprovedDisfruteByDate: jest.fn(),
      findSubordinatePositionIds: jest.fn(),
      findEmployeeApprovalContext: jest.fn(),
      findActiveEmployeesForAccrual: jest.fn(),
      findActorUser: jest.fn(),
      findEmployeeIdByUserId: jest.fn(),
      findEmployeeVacationProfile: jest.fn(),
    } as unknown as jest.Mocked<VacationsRepository>;

    userLocationsService = {
      getActiveUserLocations: jest.fn(),
    } as unknown as jest.Mocked<UserLocationsService>;

    vacationAccrualService = {
      accrueForTenant: jest.fn(),
      syncEmployeeBalance: jest.fn(),
    } as unknown as jest.Mocked<VacationAccrualService>;

    letterService = {
      generateAndStoreLetter: jest.fn(),
      getLetterPresignedUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacationsService,
        { provide: VacationsRepository, useValue: repository },
        { provide: UserLocationsService, useValue: userLocationsService },
        { provide: VacationAccrualService, useValue: vacationAccrualService },
        { provide: VACATION_LETTER_SERVICE, useValue: letterService },
      ],
    }).compile();

    service = module.get(VacationsService);
  });

  describe('requestVacation', () => {
    it('allows an employee to request vacation for themselves', async () => {
      // Arrange
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate: new Date(2024, 0, 1),
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.createRequest.mockResolvedValue(buildRequest());

      // Act
      const result = await service.requestVacation(TENANT, ACTOR_USER, {
        employeeId: EMPLOYEE_ID,
        startDate: new Date(2026, 7, 1),
        endDate: new Date(2026, 7, 5),
        type: VacationType.DISFRUTE,
      });

      // Assert
      expect(repository.createRequest).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({
          employeeId: EMPLOYEE_ID,
          daysRequested: 5,
          type: VacationType.DISFRUTE,
        }),
      );
      expect(result.status).toBe(VacationStatus.SOLICITADA);
    });

    it('rejects vacation requests for prestación de servicios contracts', async () => {
      // Arrange
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate: new Date(2024, 0, 1),
        contractType: EmployeeContractType.PRESTACION,
      });

      // Act & Assert
      await expect(
        service.requestVacation(TENANT, ACTOR_USER, {
          employeeId: EMPLOYEE_ID,
          startDate: new Date(2026, 7, 1),
          endDate: new Date(2026, 7, 5),
          type: VacationType.DISFRUTE,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.createRequest).not.toHaveBeenCalled();
    });
  });

  describe('approveLevel1', () => {
    beforeEach(() => {
      repository.findRequestById.mockResolvedValue(buildRequest());
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-supervisor',
      });
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'user-employee',
        locationId: 'loc-1',
        positionId: 'pos-employee',
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede 1' } as never,
      ]);
      repository.updateRequest.mockResolvedValue(
        buildRequest({ status: VacationStatus.APROBADA_NIVEL_1 }),
      );
    });

    it('approves when employee position is in supervisor subtree', async () => {
      // Arrange
      repository.findSubordinatePositionIds.mockResolvedValue(['pos-employee']);

      // Act
      const result = await service.approveLevel1(TENANT, SUPERVISOR_USER, 'req-1');

      // Assert
      expect(result.status).toBe(VacationStatus.APROBADA_NIVEL_1);
    });

    it('forbids approval when supervisor does not share location', async () => {
      // Arrange
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-2', name: 'Otra sede' } as never,
      ]);

      // Act & Assert
      await expect(service.approveLevel1(TENANT, SUPERVISOR_USER, 'req-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('forbids approval when employee is outside supervisor hierarchy', async () => {
      // Arrange
      repository.findSubordinatePositionIds.mockResolvedValue(['pos-other']);

      // Act & Assert
      await expect(service.approveLevel1(TENANT, SUPERVISOR_USER, 'req-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows approval when hierarchy is not configured', async () => {
      // Arrange
      repository.findSubordinatePositionIds.mockResolvedValue([]);

      // Act
      const result = await service.approveLevel1(TENANT, SUPERVISOR_USER, 'req-1');

      // Assert
      expect(result.status).toBe(VacationStatus.APROBADA_NIVEL_1);
    });

    it('allows approval when supervisor has no positionId', async () => {
      // Arrange
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: null,
      });

      // Act
      const result = await service.approveLevel1(TENANT, SUPERVISOR_USER, 'req-1');

      // Assert
      expect(result.status).toBe(VacationStatus.APROBADA_NIVEL_1);
      expect(repository.findSubordinatePositionIds).not.toHaveBeenCalled();
    });
  });

  describe('approveLevel2', () => {
    it('approves and updates balance on happy path', async () => {
      // Arrange
      repository.findRequestById
        .mockResolvedValueOnce(buildRequest({ status: VacationStatus.APROBADA_NIVEL_1 }))
        .mockResolvedValueOnce(
          buildRequest({
            status: VacationStatus.APROBADA,
            letterStorageObjectId: 'storage-1',
          }),
        );
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate: new Date(2024, 0, 1),
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.findBalanceByEmployee.mockResolvedValue(buildBalance());
      vacationAccrualService.syncEmployeeBalance.mockResolvedValue({
        balance: buildBalance(),
        monthsAccrued: 0,
        totalDaysAccrued: 0,
      });
      repository.updateRequest.mockResolvedValueOnce(
        buildRequest({ status: VacationStatus.APROBADA }),
      );
      letterService.generateAndStoreLetter.mockResolvedValue({ storageObjectId: 'storage-1' });
      repository.upsertBalance.mockResolvedValue(buildBalance({ takenDays: new Decimal(5) }));

      // Act
      const result = await service.approveLevel2(TENANT, RRHH_USER, 'req-1');

      // Assert
      expect(result.status).toBe(VacationStatus.APROBADA);
      expect(repository.upsertBalance).toHaveBeenCalled();
      expect(letterService.generateAndStoreLetter).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({ id: 'req-1' }),
        'APPROVAL',
        { rejectionReason: undefined },
      );
    });

    it('rejects approval when balance is insufficient', async () => {
      // Arrange
      repository.findRequestById.mockResolvedValue(
        buildRequest({
          status: VacationStatus.APROBADA_NIVEL_1,
          daysRequested: new Decimal(20),
        }),
      );
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate: new Date(2024, 0, 1),
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.findBalanceByEmployee.mockResolvedValue(buildBalance());

      // Act & Assert
      await expect(service.approveLevel2(TENANT, RRHH_USER, 'req-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects compensation above 50% of accrued entitlement', async () => {
      // Arrange
      repository.findRequestById.mockResolvedValue(
        buildRequest({
          status: VacationStatus.APROBADA_NIVEL_1,
          type: VacationType.COMPENSACION,
          daysRequested: new Decimal(8),
        }),
      );
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate: new Date(2024, 0, 1),
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.findBalanceByEmployee.mockResolvedValue(
        buildBalance({ accruedDays: new Decimal(15), compensatedDays: new Decimal(0) }),
      );

      // Act & Assert
      await expect(service.approveLevel2(TENANT, RRHH_USER, 'req-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects invalid transition from SOLICITADA', async () => {
      // Arrange
      repository.findRequestById.mockResolvedValue(buildRequest());

      // Act & Assert
      await expect(service.approveLevel2(TENANT, RRHH_USER, 'req-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reject', () => {
    it('rejects at level 1 with reason', async () => {
      // Arrange
      repository.findRequestById.mockResolvedValueOnce(buildRequest()).mockResolvedValueOnce(
        buildRequest({
          status: VacationStatus.RECHAZADA,
          rejectionReason: 'No hay cobertura',
        }),
      );
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: null,
      });
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'user-employee',
        locationId: 'loc-1',
        positionId: null,
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede 1' } as never,
      ]);
      repository.updateRequest.mockResolvedValue(
        buildRequest({
          status: VacationStatus.RECHAZADA,
          rejectionReason: 'No hay cobertura',
        }),
      );
      letterService.generateAndStoreLetter.mockResolvedValue({ storageObjectId: 'storage-2' });

      // Act
      const result = await service.reject(TENANT, SUPERVISOR_USER, {
        requestId: 'req-1',
        rejectionReason: 'No hay cobertura',
      });

      // Assert
      expect(result.status).toBe(VacationStatus.RECHAZADA);
    });

    it('requires rejection reason', async () => {
      // Arrange
      repository.findRequestById.mockResolvedValue(buildRequest());

      // Act & Assert
      await expect(
        service.reject(TENANT, SUPERVISOR_USER, {
          requestId: 'req-1',
          rejectionReason: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBalance', () => {
    it('syncs balance when employee has no vacation record', async () => {
      // Arrange
      const hireDate = new Date(2024, 0, 1);
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate,
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.findBalanceByEmployee.mockResolvedValue(null);
      vacationAccrualService.syncEmployeeBalance.mockResolvedValue({
        balance: buildBalance(),
        monthsAccrued: 2,
        totalDaysAccrued: 2.5,
      });

      // Act
      const result = await service.getBalance(TENANT, EMPLOYEE_ID);

      // Assert
      expect(vacationAccrualService.syncEmployeeBalance).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        hireDate,
        expect.any(Date),
      );
      expect(result.accruedDays.toNumber()).toBe(15);
    });

    it('syncs balance when lastAccrualDate is behind', async () => {
      // Arrange
      const hireDate = new Date(2024, 0, 1);
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate,
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.findBalanceByEmployee.mockResolvedValue(
        buildBalance({ lastAccrualDate: new Date(2024, 0, 1) }),
      );
      vacationAccrualService.syncEmployeeBalance.mockResolvedValue({
        balance: buildBalance({ lastAccrualDate: new Date(2026, 6, 1) }),
        monthsAccrued: 1,
        totalDaysAccrued: 1.25,
      });

      // Act
      await service.getBalance(TENANT, EMPLOYEE_ID);

      // Assert
      expect(vacationAccrualService.syncEmployeeBalance).toHaveBeenCalled();
    });

    it('throws when employee does not exist', async () => {
      // Arrange
      repository.findEmployeeVacationProfile.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getBalance(TENANT, EMPLOYEE_ID)).rejects.toThrow(NotFoundException);
    });

    it('syncs balance when lastAccrualDate is epoch zero', async () => {
      const hireDate = new Date(2024, 0, 1);
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate,
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.findBalanceByEmployee.mockResolvedValue(
        buildBalance({ lastAccrualDate: new Date(0) }),
      );
      vacationAccrualService.syncEmployeeBalance.mockResolvedValue({
        balance: buildBalance({ lastAccrualDate: new Date(2026, 6, 1) }),
        monthsAccrued: 1,
        totalDaysAccrued: 1.25,
      });

      await service.getBalance(TENANT, EMPLOYEE_ID);

      expect(vacationAccrualService.syncEmployeeBalance).toHaveBeenCalled();
    });

    it('returns existing balance when accrual is current', async () => {
      const hireDate = new Date(2024, 0, 1);
      const currentBalance = buildBalance({ lastAccrualDate: new Date(2026, 6, 1) });
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate,
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.findBalanceByEmployee.mockResolvedValue(currentBalance);

      const result = await service.getBalance(TENANT, EMPLOYEE_ID);

      expect(result).toBe(currentBalance);
      expect(vacationAccrualService.syncEmployeeBalance).not.toHaveBeenCalled();
    });

    it('does not accrue balance for prestación de servicios contracts', async () => {
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate: new Date(2024, 0, 1),
        contractType: EmployeeContractType.PRESTACION,
      });
      repository.findBalanceByEmployee.mockResolvedValue(null);
      repository.upsertBalance.mockResolvedValue(
        buildBalance({
          accruedDays: new Decimal(0),
          takenDays: new Decimal(0),
          compensatedDays: new Decimal(0),
        }),
      );

      await service.getBalance(TENANT, EMPLOYEE_ID);

      expect(vacationAccrualService.syncEmployeeBalance).not.toHaveBeenCalled();
      expect(repository.upsertBalance).toHaveBeenCalled();
    });
  });

  describe('requestVacation validations', () => {
    beforeEach(() => {
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate: new Date(2024, 0, 1),
        contractType: EmployeeContractType.INDEFINIDO,
      });
    });

    it('allows RRHH to request vacation on behalf of employee', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue('other-emp');
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.createRequest.mockResolvedValue(buildRequest());

      await service.requestVacation(TENANT, RRHH_USER, {
        employeeId: EMPLOYEE_ID,
        startDate: new Date(2026, 7, 1),
        endDate: new Date(2026, 7, 5),
        type: VacationType.DISFRUTE,
      });

      expect(repository.createRequest).toHaveBeenCalled();
    });

    it('forbids requesting vacation for another employee without role', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue('other-emp');
      repository.findActorUser.mockResolvedValue({ roleCode: 'EMPLOYEE', positionId: null });

      await expect(
        service.requestVacation(TENANT, ACTOR_USER, {
          employeeId: EMPLOYEE_ID,
          startDate: new Date(2026, 7, 1),
          endDate: new Date(2026, 7, 5),
          type: VacationType.DISFRUTE,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects invalid date range', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);

      await expect(
        service.requestVacation(TENANT, ACTOR_USER, {
          employeeId: EMPLOYEE_ID,
          startDate: new Date(2026, 7, 10),
          endDate: new Date(2026, 7, 5),
          type: VacationType.DISFRUTE,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listRequests', () => {
    it('maps employee and location names', async () => {
      repository.listRequestSummaries.mockResolvedValue([
        {
          ...buildRequest(),
          employeeName: 'Ana Pérez',
          locationId: 'loc-1',
          locationName: 'Sede Norte',
        },
      ]);

      const result = await service.listRequests(TENANT, { take: 20 });

      expect(result[0]?.employeeName).toBe('Ana Pérez');
      expect(result[0]?.locationName).toBe('Sede Norte');
    });

    it('returns empty array when there are no requests', async () => {
      repository.listRequestSummaries.mockResolvedValue([]);

      const result = await service.listRequests(TENANT, {});

      expect(result).toEqual([]);
      expect(repository.listRequestSummaries).toHaveBeenCalledWith(TENANT, {});
    });
  });

  describe('attendance integration helpers', () => {
    it('delegates approved disfrute range lookup to repository', async () => {
      const dateFrom = new Date(2026, 7, 1);
      const dateTo = new Date(2026, 7, 31);
      repository.findApprovedDisfruteRanges.mockResolvedValue([
        {
          employeeId: EMPLOYEE_ID,
          startDate: dateFrom,
          endDate: dateTo,
          type: VacationType.DISFRUTE,
        },
      ]);

      const result = await service.getApprovedDisfruteRanges(TENANT, EMPLOYEE_ID, dateFrom, dateTo);

      expect(result).toHaveLength(1);
      expect(repository.findApprovedDisfruteRanges).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        dateFrom,
        dateTo,
      );
    });

    it('delegates approved disfrute by date lookup to repository', async () => {
      const date = new Date(2026, 7, 5);
      repository.findApprovedDisfruteByDate.mockResolvedValue({
        employeeId: EMPLOYEE_ID,
        startDate: date,
        endDate: date,
        type: VacationType.DISFRUTE,
      });

      const result = await service.findApprovedDisfruteByDate(TENANT, EMPLOYEE_ID, date);

      expect(result?.employeeId).toBe(EMPLOYEE_ID);
    });
  });

  describe('assertCanViewEmployee', () => {
    it('allows employee to view own vacation data', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);

      await expect(
        service.assertCanViewEmployee(TENANT, ACTOR_USER, EMPLOYEE_ID),
      ).resolves.toBeUndefined();
    });

    it('allows RRHH to view employee vacation data', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue('other-emp');
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });

      await expect(
        service.assertCanViewEmployee(TENANT, RRHH_USER, EMPLOYEE_ID),
      ).resolves.toBeUndefined();
    });

    it('forbids viewing another employee without permission', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue('other-emp');
      repository.findActorUser.mockResolvedValue({ roleCode: 'EMPLOYEE', positionId: null });

      await expect(service.assertCanViewEmployee(TENANT, ACTOR_USER, EMPLOYEE_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getRequestForActor and getLetterUrl', () => {
    it('returns request when actor can view employee', async () => {
      repository.findRequestById.mockResolvedValue(buildRequest());
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);

      const result = await service.getRequestForActor(TENANT, ACTOR_USER, 'req-1');

      expect(result.id).toBe('req-1');
    });

    it('returns presigned letter url when letter service is available', async () => {
      repository.findRequestById.mockResolvedValue(buildRequest());
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);
      letterService.getLetterPresignedUrl.mockResolvedValue('https://signed.example/letter.pdf');

      const url = await service.getLetterUrl(TENANT, ACTOR_USER, 'req-1');

      expect(url).toBe('https://signed.example/letter.pdf');
    });

    it('throws when request does not exist', async () => {
      repository.findRequestById.mockResolvedValue(null);

      await expect(service.getRequestForActor(TENANT, ACTOR_USER, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approveLevel1 edge cases', () => {
    it('rejects invalid transition', async () => {
      repository.findRequestById.mockResolvedValue(
        buildRequest({ status: VacationStatus.APROBADA_NIVEL_1 }),
      );

      await expect(service.approveLevel1(TENANT, SUPERVISOR_USER, 'req-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('forbids approval when actor lacks level 1 role', async () => {
      repository.findRequestById.mockResolvedValue(buildRequest());
      repository.findActorUser.mockResolvedValue({ roleCode: 'EMPLOYEE', positionId: null });

      await expect(service.approveLevel1(TENANT, ACTOR_USER, 'req-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws when request employee does not exist', async () => {
      repository.findRequestById.mockResolvedValue(buildRequest());
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-supervisor',
      });
      repository.findEmployeeApprovalContext.mockResolvedValue(null);

      await expect(service.approveLevel1(TENANT, SUPERVISOR_USER, 'req-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approveLevel2 compensation', () => {
    it('updates compensatedDays for COMPENSACION approval', async () => {
      repository.findRequestById
        .mockResolvedValueOnce(
          buildRequest({
            status: VacationStatus.APROBADA_NIVEL_1,
            type: VacationType.COMPENSACION,
            daysRequested: new Decimal(5),
          }),
        )
        .mockResolvedValueOnce(
          buildRequest({
            status: VacationStatus.APROBADA,
            type: VacationType.COMPENSACION,
          }),
        );
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate: new Date(2024, 0, 1),
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.findBalanceByEmployee.mockResolvedValue(buildBalance());
      vacationAccrualService.syncEmployeeBalance.mockResolvedValue({
        balance: buildBalance(),
        monthsAccrued: 0,
        totalDaysAccrued: 0,
      });
      repository.updateRequest.mockResolvedValue(
        buildRequest({ status: VacationStatus.APROBADA, type: VacationType.COMPENSACION }),
      );
      repository.upsertBalance.mockResolvedValue(buildBalance({ compensatedDays: new Decimal(5) }));

      await service.approveLevel2(TENANT, RRHH_USER, 'req-1');

      expect(repository.upsertBalance).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        expect.objectContaining({
          compensatedDays: expect.any(Decimal),
        }),
      );
    });

    it('forbids level 2 approval without NOMINA role', async () => {
      repository.findRequestById.mockResolvedValue(
        buildRequest({ status: VacationStatus.APROBADA_NIVEL_1 }),
      );
      repository.findActorUser.mockResolvedValue({ roleCode: 'SUPERVISOR', positionId: null });

      await expect(service.approveLevel2(TENANT, SUPERVISOR_USER, 'req-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('reject level 2', () => {
    it('rejects at level 2 with reason', async () => {
      repository.findRequestById
        .mockResolvedValueOnce(buildRequest({ status: VacationStatus.APROBADA_NIVEL_1 }))
        .mockResolvedValueOnce(
          buildRequest({
            status: VacationStatus.RECHAZADA,
            rejectionReason: 'Saldo insuficiente',
          }),
        );
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.updateRequest.mockResolvedValue(
        buildRequest({
          status: VacationStatus.RECHAZADA,
          rejectionReason: 'Saldo insuficiente',
        }),
      );

      const result = await service.reject(TENANT, RRHH_USER, {
        requestId: 'req-1',
        rejectionReason: 'Saldo insuficiente',
      });

      expect(result.status).toBe(VacationStatus.RECHAZADA);
    });

    it('rejects invalid state transitions', async () => {
      repository.findRequestById.mockResolvedValue(
        buildRequest({ status: VacationStatus.APROBADA }),
      );

      await expect(
        service.reject(TENANT, RRHH_USER, {
          requestId: 'req-1',
          rejectionReason: 'Tarde',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('service without letter provider', () => {
    let serviceWithoutLetter: VacationsService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VacationsService,
          { provide: VacationsRepository, useValue: repository },
          { provide: UserLocationsService, useValue: userLocationsService },
          { provide: VacationAccrualService, useValue: vacationAccrualService },
        ],
      }).compile();

      serviceWithoutLetter = module.get(VacationsService);
    });

    it('throws when letter service is not configured', async () => {
      repository.findRequestById.mockResolvedValue(buildRequest());
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);

      await expect(serviceWithoutLetter.getLetterUrl(TENANT, ACTOR_USER, 'req-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('approves level 2 without generating letter when letter service is absent', async () => {
      repository.findRequestById
        .mockResolvedValueOnce(buildRequest({ status: VacationStatus.APROBADA_NIVEL_1 }))
        .mockResolvedValueOnce(buildRequest({ status: VacationStatus.APROBADA }));
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findEmployeeVacationProfile.mockResolvedValue({
        hireDate: new Date(2024, 0, 1),
        contractType: EmployeeContractType.INDEFINIDO,
      });
      repository.findBalanceByEmployee.mockResolvedValue(buildBalance());
      vacationAccrualService.syncEmployeeBalance.mockResolvedValue({
        balance: buildBalance(),
        monthsAccrued: 0,
        totalDaysAccrued: 0,
      });
      repository.updateRequest.mockResolvedValue(buildRequest({ status: VacationStatus.APROBADA }));
      repository.upsertBalance.mockResolvedValue(buildBalance({ takenDays: new Decimal(5) }));

      const result = await serviceWithoutLetter.approveLevel2(TENANT, RRHH_USER, 'req-1');

      expect(result.status).toBe(VacationStatus.APROBADA);
      expect(letterService.generateAndStoreLetter).not.toHaveBeenCalled();
    });
  });
});
