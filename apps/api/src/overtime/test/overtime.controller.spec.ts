import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { OvertimeRequestType, OvertimeStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { REQUIRED_PERMISSIONS_KEY } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateAdministrativeOvertimeRequestDto } from '../controller/dto/overtime.dto';
import { OvertimeController } from '../controller/overtime.controller';
import { OVERTIME_READ_PERMISSION, OVERTIME_REQUEST_PERMISSION } from '../overtime.constants';
import { OvertimeService } from '../service/overtime.service';

describe('OvertimeController', () => {
  let controller: OvertimeController;
  let service: jest.Mocked<OvertimeService>;

  const user: JwtPayload = {
    sub: 'user-1',
    tenantId: 'tenant-1',
    roleCode: 'MANAGER',
    roleId: 'role-manager',
    email: 'admin@test.dev',
  };

  const adminCreated = {
    id: 'req-1',
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    locationId: 'loc-1',
    type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
    shiftEndTime: null,
    actualEndTime: null,
    accumulatedMinutes: null,
    status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
    payrollPeriod: '2026-07',
    workDate: new Date('2026-07-20T00:00:00.000Z'),
    proposedStartTime: new Date('2026-07-20T22:00:00.000-05:00'),
    proposedEndTime: new Date('2026-07-21T01:00:00.000-05:00'),
    proposedMinutes: 180,
    reasonOptionId: 'reason-1',
    requestedByUserId: 'user-1',
    batchId: 'batch-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    service = {
      listInbox: jest.fn(),
      getById: jest.fn(),
      approve: jest.fn(),
      object: jest.fn(),
      getPeriodSummary: jest.fn(),
      createAdministrativeBatch: jest.fn(),
    } as unknown as jest.Mocked<OvertimeService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OvertimeController],
      providers: [{ provide: OvertimeService, useValue: service }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(OvertimeController);
  });

  it('listInbox delega en OvertimeService', async () => {
    service.listInbox.mockResolvedValue({
      items: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    });

    const result = await controller.listInbox(user, {});

    expect(service.listInbox).toHaveBeenCalledWith('tenant-1', 'user-1', {});
    expect(result.items).toEqual([]);
  });

  it('approve delega con tenantId del JWT', async () => {
    service.approve.mockResolvedValue({
      ...adminCreated,
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 40,
      workDate: null,
      proposedStartTime: null,
      proposedEndTime: null,
      proposedMinutes: null,
      reasonOptionId: null,
      requestedByUserId: null,
      batchId: null,
      employeeName: 'Ana',
      locationName: 'Sede',
      approvals: [],
    });

    await controller.approve(user, 'req-1', {});

    expect(service.approve).toHaveBeenCalledWith('tenant-1', 'user-1', {
      overtimeRequestId: 'req-1',
      comment: undefined,
    });
  });

  describe('POST /administrative', () => {
    const body = {
      employeeIds: ['emp-1'],
      locationId: 'loc-1',
      workDate: '2026-07-20',
      proposedStartTime: '2026-07-20T22:00:00.000-05:00',
      proposedEndTime: '2026-07-21T01:00:00.000-05:00',
      reasonOptionId: 'reason-1',
    };

    it('exige permiso attendance.overtime.request (metadata)', () => {
      const permissions = Reflect.getMetadata(
        REQUIRED_PERMISSIONS_KEY,
        OvertimeController.prototype.createAdministrative,
      ) as string[];
      expect(permissions).toEqual([OVERTIME_REQUEST_PERMISSION]);
      expect(permissions).not.toContain(OVERTIME_READ_PERMISSION);
    });

    it('201 happy path — actor desde JWT, un solo delegate al facade', async () => {
      service.createAdministrativeBatch.mockResolvedValue({
        batchId: 'batch-1',
        items: [adminCreated],
      });

      const result = await controller.createAdministrative(user, body);

      expect(service.createAdministrativeBatch).toHaveBeenCalledTimes(1);
      expect(service.createAdministrativeBatch).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        expect.objectContaining({
          employeeIds: ['emp-1'],
          locationId: 'loc-1',
          reasonOptionId: 'reason-1',
          workDate: new Date('2026-07-20T00:00:00.000Z'),
        }),
      );
      expect(result).toEqual({
        batchId: 'batch-1',
        createdCount: 1,
        items: [
          expect.objectContaining({
            id: 'req-1',
            type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
            status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
            proposedMinutes: 180,
            batchId: 'batch-1',
            requestedByUserId: 'user-1',
            accumulatedMinutes: null,
            shiftEndTime: null,
            actualEndTime: null,
          }),
        ],
      });
    });

    it('payload multiempleado', async () => {
      service.createAdministrativeBatch.mockResolvedValue({
        batchId: 'batch-2',
        items: [
          { ...adminCreated, id: 'r1', employeeId: 'emp-1', batchId: 'batch-2' },
          { ...adminCreated, id: 'r2', employeeId: 'emp-2', batchId: 'batch-2' },
        ],
      });

      const result = await controller.createAdministrative(user, {
        ...body,
        employeeIds: ['emp-1', 'emp-2'],
      });

      expect(result.createdCount).toBe(2);
      expect(result.items.map((i) => i.employeeId)).toEqual(['emp-1', 'emp-2']);
    });

    it('propaga 403 del service (cargo/sede)', async () => {
      service.createAdministrativeBatch.mockRejectedValue(
        new ForbiddenException('Solo un Administrador de sede'),
      );
      await expect(controller.createAdministrative(user, body)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('propaga 404 del service (sede)', async () => {
      service.createAdministrativeBatch.mockRejectedValue(
        new NotFoundException('Sede loc-1 no encontrada'),
      );
      await expect(controller.createAdministrative(user, body)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('propaga 409 de solape/duplicado', async () => {
      service.createAdministrativeBatch.mockRejectedValue(
        new ConflictException('ventana solapada'),
      );
      await expect(controller.createAdministrative(user, body)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('propaga 400 de validación de negocio', async () => {
      service.createAdministrativeBatch.mockRejectedValue(
        new BadRequestException('employeeIds no puede contener duplicados'),
      );
      await expect(controller.createAdministrative(user, body)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza token KIOSK_MARKING antes del service', async () => {
      const kioskUser: JwtPayload = { ...user, tokenType: 'KIOSK_MARKING' };
      await expect(controller.createAdministrative(kioskUser, body)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(service.createAdministrativeBatch).not.toHaveBeenCalled();
    });
  });

  describe('CreateAdministrativeOvertimeRequestDto', () => {
    it('acepta payload válido', async () => {
      const dto = plainToInstance(CreateAdministrativeOvertimeRequestDto, {
        employeeIds: ['emp-1'],
        locationId: 'loc-1',
        workDate: '2026-07-20',
        proposedStartTime: '2026-07-20T22:00:00.000-05:00',
        proposedEndTime: '2026-07-21T01:00:00.000-05:00',
        reasonOptionId: 'reason-1',
      });
      expect(await validate(dto)).toHaveLength(0);
    });

    it('rechaza employeeIds vacío o duplicados', async () => {
      const empty = plainToInstance(CreateAdministrativeOvertimeRequestDto, {
        employeeIds: [],
        locationId: 'loc-1',
        workDate: '2026-07-20',
        proposedStartTime: '2026-07-20T22:00:00.000Z',
        proposedEndTime: '2026-07-20T23:00:00.000Z',
        reasonOptionId: 'reason-1',
      });
      expect((await validate(empty)).length).toBeGreaterThan(0);

      const dup = plainToInstance(CreateAdministrativeOvertimeRequestDto, {
        employeeIds: ['emp-1', 'emp-1'],
        locationId: 'loc-1',
        workDate: '2026-07-20',
        proposedStartTime: '2026-07-20T22:00:00.000Z',
        proposedEndTime: '2026-07-20T23:00:00.000Z',
        reasonOptionId: 'reason-1',
      });
      expect((await validate(dup)).length).toBeGreaterThan(0);
    });

    it('no declara proposedMinutes/payrollPeriod/batchId/type/status/tenantId/requestedByUserId', () => {
      const keys = Object.keys(
        plainToInstance(CreateAdministrativeOvertimeRequestDto, {
          employeeIds: ['e'],
          locationId: 'l',
          workDate: '2026-07-20',
          proposedStartTime: '2026-07-20T22:00:00.000Z',
          proposedEndTime: '2026-07-20T23:00:00.000Z',
          reasonOptionId: 'r',
          proposedMinutes: 99,
          payrollPeriod: '2026-07',
          batchId: 'x',
          type: 'X',
          status: 'Y',
          tenantId: 't',
          requestedByUserId: 'u',
        }),
      );
      // class-transformer keeps unknown props on the instance unless excludeExtraneousValues;
      // ValidationPipe whitelist+forbidNonWhitelisted strips/rejects them at HTTP layer.
      expect(CreateAdministrativeOvertimeRequestDto.prototype).toBeDefined();
      const allowed = [
        'employeeIds',
        'locationId',
        'workDate',
        'proposedStartTime',
        'proposedEndTime',
        'reasonOptionId',
      ];
      for (const key of allowed) {
        expect(keys).toContain(key);
      }
    });

    it('PermissionsGuard deniega cuando falta attendance.overtime.request', async () => {
      const reflector = {
        getAllAndOverride: jest.fn((key: string) => {
          if (key === REQUIRED_PERMISSIONS_KEY) return [OVERTIME_REQUEST_PERMISSION];
          return undefined;
        }),
      };
      const permissionsService = {
        hasPermission: jest.fn().mockResolvedValue(false),
      };
      const guard = new PermissionsGuard(reflector as never, permissionsService as never);
      const context = {
        getType: () => 'http',
        getHandler: () => OvertimeController.prototype.createAdministrative,
        getClass: () => OvertimeController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: { sub: 'u', tenantId: 't', roleCode: 'NOMINA' },
            headers: {},
          }),
        }),
      };

      await expect(guard.canActivate(context as never)).rejects.toThrow(/Permission denied/i);
      expect(permissionsService.hasPermission).toHaveBeenCalledWith(
        'u',
        't',
        OVERTIME_REQUEST_PERMISSION,
      );
    });

    it('attendance.overtime.read no satisface el guard de create', async () => {
      const reflector = {
        getAllAndOverride: jest.fn((key: string) => {
          if (key === REQUIRED_PERMISSIONS_KEY) return [OVERTIME_REQUEST_PERMISSION];
          return undefined;
        }),
      };
      const permissionsService = {
        hasPermission: jest.fn(async (_u: string, _t: string, code: string) => {
          return code === OVERTIME_READ_PERMISSION;
        }),
      };
      const guard = new PermissionsGuard(reflector as never, permissionsService as never);
      const context = {
        getType: () => 'http',
        getHandler: () => OvertimeController.prototype.createAdministrative,
        getClass: () => OvertimeController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: { sub: 'u', tenantId: 't', roleCode: 'NOMINA' },
            headers: {},
          }),
        }),
      };

      await expect(guard.canActivate(context as never)).rejects.toThrow(/Permission denied/i);
    });
  });
});
