import { BadRequestException, type CanActivate } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { TurnoAssignmentType, TurnoJornada } from '@prisma/client';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TurnoAssignmentsController } from '../controller/turno-assignments.controller';
import { TurnoAssignmentsService } from '../service/turno-assignments.service';

const allowGuard: CanActivate = { canActivate: (): boolean => true };

describe('TurnoAssignmentsController', () => {
  let controller: TurnoAssignmentsController;
  let service: jest.Mocked<TurnoAssignmentsService>;

  const tenantId = 'tenant-1';
  const user = { tenantId, sub: 'user-1', roleCode: 'SUPERVISOR' } as const;

  const weeklyResult = {
    weekStart: '2026-07-06',
    dates: ['2026-07-06'],
    colaboradores: [],
    pagination: { total: 0, page: 1, limit: 50 },
  };

  const assignmentRecord = {
    id: 'assignment-1',
    tenantId,
    turnoId: 'turno-1',
    employeeId: 'emp-1',
    workDate: new Date('2026-07-06T00:00:00.000Z'),
    type: TurnoAssignmentType.ASSIGNED,
    createdByUserId: user.sub,
    updatedByUserId: user.sub,
    createdAt: new Date(),
    updatedAt: new Date(),
    turno: {
      id: 'turno-1',
      nombre: 'Turno mañana',
      sigla: 'TM',
      horaInicio: '06:00',
      horaFin: '14:00',
      jornada: TurnoJornada.DIURNO,
    },
  };

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurnoAssignmentsController],
      providers: [
        {
          provide: TurnoAssignmentsService,
          useValue: {
            getWeekly: jest.fn(),
            assign: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(allowGuard)
      .compile();

    controller = module.get(TurnoAssignmentsController);
    service = module.get(TurnoAssignmentsService);
  });

  it('resuelve tenantId del JWT y delega la vista semanal al service', async (): Promise<void> => {
    service.getWeekly.mockResolvedValue(weeklyResult);

    const result = await controller.findWeekly({ ...user } as never, tenantId, {
      weekStart: '2026-07-08',
    });

    expect(service.getWeekly).toHaveBeenCalledWith(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      expect.objectContaining({ weekStart: new Date('2026-07-08T00:00:00.000Z') }),
    );
    expect(result.weekStart).toBe('2026-07-06');
  });

  it('lanza 400 si no hay tenantId en JWT ni header', async (): Promise<void> => {
    await expect(
      controller.findWeekly({ ...user, tenantId: '' } as never, '', { weekStart: '2026-07-08' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('crea/reasigna un turno y devuelve la respuesta mapeada', async (): Promise<void> => {
    service.assign.mockResolvedValue(assignmentRecord);

    const result = await controller.assign({ ...user } as never, tenantId, {
      employeeId: 'emp-1',
      workDate: '2026-07-06',
      turnoId: 'turno-1',
    });

    expect(service.assign).toHaveBeenCalledWith(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      { employeeId: 'emp-1', workDate: '2026-07-06', turnoId: 'turno-1' },
    );
    expect(result).toMatchObject({ id: 'assignment-1', workDate: '2026-07-06' });
  });

  it('elimina una asignación delegando al service', async (): Promise<void> => {
    await controller.remove({ ...user } as never, tenantId, 'assignment-1');

    expect(service.remove).toHaveBeenCalledWith(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      'assignment-1',
    );
  });
});
