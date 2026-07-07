import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { TurnoJornada, TurnoTipo } from '@prisma/client';
import * as ExcelJS from 'exceljs';

import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import { TurnosRepository } from '../repository/turnos.repository';
import { TurnoAssignmentsTemplateService } from '../service/turno-assignments-template.service';
import { TurnoAssignmentsService } from '../service/turno-assignments.service';
import { parseDateOnly } from '../turno-assignments.utils';

describe('TurnoAssignmentsTemplateService', () => {
  let service: TurnoAssignmentsTemplateService;
  let assignmentsRepository: jest.Mocked<TurnoAssignmentsRepository>;
  let turnosRepository: jest.Mocked<TurnosRepository>;
  let assignmentsService: jest.Mocked<TurnoAssignmentsService>;

  const tenantId = 'tenant-1';
  const ownerActor = { userId: 'owner-1', roleCode: 'OWNER' };
  const supervisorActor = { userId: 'sup-1', roleCode: 'SUPERVISOR' };

  const employeeRow = {
    id: 'emp-1',
    userId: 'user-1',
    nombre: 'Ana Pérez',
    documento: '123',
    locationId: 'loc-1',
    isActive: true,
  };

  const activeTurno = {
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
    createdByUserId: null,
    updatedByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnoAssignmentsTemplateService,
        {
          provide: TurnoAssignmentsRepository,
          useValue: {
            findEmployeesByIds: jest.fn(),
            logTemplateExportAudit: jest.fn(),
          },
        },
        {
          provide: TurnosRepository,
          useValue: {
            findAllFiltered: jest.fn(),
          },
        },
        {
          provide: TurnoAssignmentsService,
          useValue: {
            resolveScope: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TurnoAssignmentsTemplateService);
    assignmentsRepository = module.get(TurnoAssignmentsRepository);
    turnosRepository = module.get(TurnosRepository);
    assignmentsService = module.get(TurnoAssignmentsService);

    assignmentsRepository.findEmployeesByIds.mockResolvedValue([employeeRow]);
    turnosRepository.findAllFiltered.mockResolvedValue([activeTurno]);
    assignmentsService.resolveScope.mockResolvedValue(null);
  });

  const futureOptions = {
    from: parseDateOnly('2026-08-03'),
    to: parseDateOnly('2026-08-07'),
    weekdaysIso: [1, 2, 3, 4, 5],
    employeeIds: ['emp-1'],
  };

  it('genera un .xlsx con hoja Turnos y Turnos Disponibles', async () => {
    const { buffer, filename } = await service.generateTemplate(
      tenantId,
      ownerActor,
      futureOptions,
    );

    expect(filename).toBe('plantilla_turnos_2026-08-03_2026-08-07.xlsx');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);

    const sheet = workbook.getWorksheet('Turnos');
    const availableSheet = workbook.getWorksheet('Turnos Disponibles');
    expect(sheet).toBeDefined();
    expect(availableSheet).toBeDefined();

    const headerValues = sheet?.getRow(1).values as unknown[];
    expect(headerValues).toEqual(
      expect.arrayContaining(['Documento', 'Nombre Colaborador', 'Employee ID']),
    );

    const firstDataRow = sheet?.getRow(2).values as unknown[];
    expect(firstDataRow).toEqual(expect.arrayContaining(['123', 'Ana Pérez', 'emp-1']));

    expect(assignmentsRepository.logTemplateExportAudit).toHaveBeenCalledWith(
      tenantId,
      ownerActor.userId,
      expect.objectContaining({ employeeCount: 1 }),
    );
  });

  it('rechaza si "to" es anterior a "from"', async () => {
    await expect(
      service.generateTemplate(tenantId, ownerActor, {
        ...futureOptions,
        from: parseDateOnly('2026-08-10'),
        to: parseDateOnly('2026-08-01'),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza rangos mayores a 90 días', async () => {
    await expect(
      service.generateTemplate(tenantId, ownerActor, {
        ...futureOptions,
        from: parseDateOnly('2026-01-01'),
        to: parseDateOnly('2026-12-31'),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza sin colaboradores seleccionados', async () => {
    await expect(
      service.generateTemplate(tenantId, ownerActor, { ...futureOptions, employeeIds: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza sin días de semana seleccionados', async () => {
    await expect(
      service.generateTemplate(tenantId, ownerActor, { ...futureOptions, weekdaysIso: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza si algún colaborador no existe en el tenant', async () => {
    assignmentsRepository.findEmployeesByIds.mockResolvedValue([]);

    await expect(service.generateTemplate(tenantId, ownerActor, futureOptions)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rechaza si algún colaborador está inactivo', async () => {
    assignmentsRepository.findEmployeesByIds.mockResolvedValue([
      { ...employeeRow, isActive: false },
    ]);

    await expect(service.generateTemplate(tenantId, ownerActor, futureOptions)).rejects.toThrow(
      ConflictException,
    );
  });

  it('rechaza si un colaborador está fuera de la sede del supervisor', async () => {
    assignmentsService.resolveScope.mockResolvedValue(['loc-2']);

    await expect(
      service.generateTemplate(tenantId, supervisorActor, futureOptions),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite generar si el colaborador está dentro de la sede del supervisor', async () => {
    assignmentsService.resolveScope.mockResolvedValue(['loc-1']);

    await expect(
      service.generateTemplate(tenantId, supervisorActor, futureOptions),
    ).resolves.toBeDefined();
  });

  it('rechaza fecha de inicio pasada para roles distintos de OWNER/SUPER_ADMIN', async () => {
    await expect(
      service.generateTemplate(tenantId, supervisorActor, {
        ...futureOptions,
        from: parseDateOnly('2020-01-01'),
        to: parseDateOnly('2020-01-05'),
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite fecha de inicio pasada para OWNER', async () => {
    await expect(
      service.generateTemplate(tenantId, ownerActor, {
        ...futureOptions,
        from: parseDateOnly('2020-01-01'),
        to: parseDateOnly('2020-01-05'),
      }),
    ).resolves.toBeDefined();
  });
});
