import { BadRequestException, type CanActivate } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { TurnoJornada, TurnoTipo } from '@prisma/client';
import type { Response } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TurnosController } from '../controller/turnos.controller';
import type { ExportTurnosQueryDto } from '../controller/dto/list-turnos-query.dto';
import { TurnosService } from '../service/turnos.service';

const allowGuard: CanActivate = { canActivate: (): boolean => true };

describe('TurnosController', () => {
  let controller: TurnosController;
  let service: jest.Mocked<TurnosService>;

  const tenantId = 'tenant-1';
  const user = { tenantId, sub: 'user-1', roleCode: 'SUPER_ADMIN' } as const;
  const mockTurno = {
    id: 'turno-1',
    tenantId,
    locationId: 'loc-1',
    nombre: 'Turno mañana',
    sigla: 'TM',
    tipo: TurnoTipo.PERMANENTE,
    jornada: TurnoJornada.DIURNO,
    horaInicio: '06:00',
    horaFin: '14:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    estado: true,
    createdByUserId: user.sub,
    updatedByUserId: user.sub,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurnosController],
      providers: [
        {
          provide: TurnosService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateEstado: jest.fn(),
            exportExcel: jest.fn(),
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

    controller = module.get(TurnosController);
    service = module.get(TurnosService);
  });

  it('lista turnos paginados', async (): Promise<void> => {
    service.findAll.mockResolvedValue({
      data: [mockTurno],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await controller.findAll({ ...user } as never, tenantId, {});

    expect(service.findAll).toHaveBeenCalledWith(tenantId, {});
    expect(result.data[0].sigla).toBe('TM');
  });

  it('crea turno', async (): Promise<void> => {
    service.create.mockResolvedValue(mockTurno);

    const result = await controller.create({ ...user } as never, tenantId, {
      locationId: 'loc-1',
      nombre: 'Turno mañana',
      sigla: 'TM',
      tipo: TurnoTipo.PERMANENTE,
      jornada: TurnoJornada.DIURNO,
      horaInicio: '06:00',
      horaFin: '14:00',
      daysOfWeek: [1, 2, 3, 4, 5],
    });

    expect(service.create).toHaveBeenCalledWith(tenantId, expect.any(Object), user.sub);
    expect(result.id).toBe('turno-1');
  });

  it('exporta excel con headers correctos', async (): Promise<void> => {
    service.exportExcel.mockResolvedValue(Buffer.from('xlsx'));
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const setHeader = jest.fn();
    const res = { status, setHeader, send } as unknown as Response;

    await controller.exportar(
      { ...user } as never,
      tenantId,
      { formato: 'excel' } as ExportTurnosQueryDto,
      res,
    );

    expect(service.exportExcel).toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="turnos.xlsx"',
    );
    expect(send).toHaveBeenCalledWith(Buffer.from('xlsx'));
  });

  it('exporta responde 204 sin registros', async (): Promise<void> => {
    service.exportExcel.mockResolvedValue(null);
    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const res = { status, setHeader: jest.fn(), send } as unknown as Response;

    await controller.exportar(
      { ...user } as never,
      tenantId,
      { formato: 'excel' } as ExportTurnosQueryDto,
      res,
    );

    expect(status).toHaveBeenCalledWith(204);
    expect(send).toHaveBeenCalledWith();
  });

  it('rechaza formato distinto de excel', async (): Promise<void> => {
    const res = { status: jest.fn(), setHeader: jest.fn(), send: jest.fn() } as unknown as Response;

    await expect(
      controller.exportar(
        { ...user } as never,
        tenantId,
        { formato: 'pdf' } as ExportTurnosQueryDto,
        res,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
