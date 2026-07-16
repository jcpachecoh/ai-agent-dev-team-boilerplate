import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { TurnoAssignmentType, TurnoJornada, TurnoTipo } from '@prisma/client';
import * as ExcelJS from 'exceljs';

import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import { TurnosRepository } from '../repository/turnos.repository';
import { TurnoAssignmentsImportService } from '../service/turno-assignments-import.service';
import { TurnoAssignmentsService } from '../service/turno-assignments.service';
import { SCOPE_FORBIDDEN_MESSAGE } from '../turnos.constants';

async function buildWorkbookBuffer(
  rows: Array<Record<string, string>>,
  dateHeaders: string[],
  sheetName = 'Turnos',
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = [
    { header: 'Documento', key: 'documento' },
    { header: 'Nombre Colaborador', key: 'nombre' },
    { header: 'Employee ID', key: 'employeeId' },
    ...dateHeaders.map((header) => ({ header, key: header })),
  ];
  rows.forEach((row) => sheet.addRow(row));
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

describe('TurnoAssignmentsImportService', () => {
  let service: TurnoAssignmentsImportService;
  let assignmentsRepository: jest.Mocked<TurnoAssignmentsRepository>;
  let turnosRepository: jest.Mocked<TurnosRepository>;
  let assignmentsService: jest.Mocked<TurnoAssignmentsService>;

  const tenantId = 'tenant-1';
  const ownerActor = { userId: 'owner-1', roleCode: 'OWNER' };
  const supervisorActor = { userId: 'sup-1', roleCode: 'SUPERVISOR' };

  const employeeScope = { id: 'emp-1', locationId: 'loc-1', isActive: true };
  const activeTurno = {
    id: 'turno-1',
    tenantId,
    locationId: 'loc-1',
    nombre: 'Turno mañana',
    sigla: 'TM',
    tipo: TurnoTipo.PERMANENTE,
    horaInicio: '06:00',
    horaFin: '14:00',
    jornada: TurnoJornada.DIURNO,
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
        TurnoAssignmentsImportService,
        {
          provide: TurnoAssignmentsRepository,
          useValue: {
            findByEmployeeAndDate: jest.fn(),
            findEmployeeScope: jest.fn(),
            findEmployeeByDocument: jest.fn(),
          },
        },
        {
          provide: TurnosRepository,
          useValue: {
            findBySigla: jest.fn(),
          },
        },
        {
          provide: TurnoAssignmentsService,
          useValue: {
            resolveScope: jest.fn(),
            assign: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TurnoAssignmentsImportService);
    assignmentsRepository = module.get(TurnoAssignmentsRepository);
    turnosRepository = module.get(TurnosRepository);
    assignmentsService = module.get(TurnoAssignmentsService);

    assignmentsService.resolveScope.mockResolvedValue(null);
    assignmentsRepository.findEmployeeScope.mockResolvedValue(employeeScope);
    assignmentsRepository.findEmployeeByDocument.mockResolvedValue(employeeScope);
    turnosRepository.findBySigla.mockResolvedValue(activeTurno);
    assignmentsService.assign.mockResolvedValue({
      id: 'assignment-1',
      tenantId,
      employeeId: 'emp-1',
      turnoId: 'turno-1',
      workDate: new Date('2026-08-03T00:00:00.000Z'),
      type: TurnoAssignmentType.ASSIGNED,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: null,
    });
  });

  it('rechaza si el archivo no tiene la hoja "Turnos"', async () => {
    const buffer = await buildWorkbookBuffer([], ['2026-08-03'], 'OtraHoja');
    await expect(service.importFromExcel(tenantId, ownerActor, buffer)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('asigna un turno resolviendo el empleado por Employee ID', async () => {
    const buffer = await buildWorkbookBuffer(
      [{ documento: '', nombre: '', employeeId: 'emp-1', '2026-08-03': 'TM' }],
      ['2026-08-03'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(assignmentsRepository.findEmployeeScope).toHaveBeenCalledWith(tenantId, 'emp-1');
    expect(assignmentsService.assign).toHaveBeenCalledWith(tenantId, ownerActor, {
      employeeId: 'emp-1',
      workDate: '2026-08-03',
      turnoId: 'turno-1',
    });
    expect(result.createdOrUpdated).toBe(1);
    expect(result.totalAssignments).toBe(1);
    expect(result.errorCount).toBe(0);
  });

  it('CONN-12: import no auto-aprueba — solo escribe vía assign (plan queda DRAFT)', async () => {
    const buffer = await buildWorkbookBuffer(
      [{ documento: '', nombre: '', employeeId: 'emp-1', '2026-08-03': 'TM' }],
      ['2026-08-03'],
    );

    await service.importFromExcel(tenantId, ownerActor, buffer);

    // Excel reutiliza assign (getOrCreatePlan → DRAFT). No hay submit/approve en el import.
    expect(assignmentsService.assign).toHaveBeenCalledTimes(1);
    expect(assignmentsService.resolveScope).toHaveBeenCalled();
  });

  it('usa fallback por documento cuando no viene Employee ID', async () => {
    assignmentsRepository.findEmployeeScope.mockResolvedValue(null);

    const buffer = await buildWorkbookBuffer(
      [{ documento: '123456', nombre: 'Ana', employeeId: '', '2026-08-03': 'TM' }],
      ['2026-08-03'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(assignmentsRepository.findEmployeeByDocument).toHaveBeenCalledWith(tenantId, '123456');
    expect(result.createdOrUpdated).toBe(1);
  });

  it('ignora celdas vacías', async () => {
    const buffer = await buildWorkbookBuffer(
      [
        {
          documento: '',
          nombre: '',
          employeeId: 'emp-1',
          '2026-08-03': '',
          '2026-08-04': 'TM',
        },
      ],
      ['2026-08-03', '2026-08-04'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(assignmentsService.assign).toHaveBeenCalledTimes(1);
    expect(result.totalAssignments).toBe(1);
  });

  it('BASE elimina la asignación existente y cuenta returnedToBase', async () => {
    assignmentsRepository.findByEmployeeAndDate.mockResolvedValue({
      id: 'assignment-existing',
      tenantId,
      employeeId: 'emp-1',
      turnoId: 'turno-1',
      workDate: new Date('2026-08-03T00:00:00.000Z'),
      type: TurnoAssignmentType.ASSIGNED,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: null,
    });

    const buffer = await buildWorkbookBuffer(
      [{ documento: '', nombre: '', employeeId: 'emp-1', '2026-08-03': 'BASE' }],
      ['2026-08-03'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(assignmentsService.remove).toHaveBeenCalledWith(
      tenantId,
      ownerActor,
      'assignment-existing',
    );
    expect(result.returnedToBase).toBe(1);
    expect(result.totalAssignments).toBe(1);
  });

  it('BASE sin asignación previa no hace nada (no-op)', async () => {
    assignmentsRepository.findByEmployeeAndDate.mockResolvedValue(null);

    const buffer = await buildWorkbookBuffer(
      [{ documento: '', nombre: '', employeeId: 'emp-1', '2026-08-03': 'BASE' }],
      ['2026-08-03'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(assignmentsService.remove).not.toHaveBeenCalled();
    expect(result.returnedToBase).toBe(0);
    expect(result.totalAssignments).toBe(0);
    expect(result.errorCount).toBe(0);
  });

  it('DESCANSO marca descanso explícito', async () => {
    const buffer = await buildWorkbookBuffer(
      [{ documento: '', nombre: '', employeeId: 'emp-1', '2026-08-03': 'DESCANSO' }],
      ['2026-08-03'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(assignmentsService.assign).toHaveBeenCalledWith(tenantId, ownerActor, {
      employeeId: 'emp-1',
      workDate: '2026-08-03',
      type: TurnoAssignmentType.REST,
    });
    expect(result.restDays).toBe(1);
  });

  it('sigla inválida genera un error parcial sin detener el resto', async () => {
    turnosRepository.findBySigla.mockImplementation((_tenantId, sigla) =>
      Promise.resolve(sigla === 'XYZ' ? null : activeTurno),
    );

    const buffer = await buildWorkbookBuffer(
      [
        {
          documento: '',
          nombre: '',
          employeeId: 'emp-1',
          '2026-08-03': 'XYZ',
          '2026-08-04': 'TM',
        },
      ],
      ['2026-08-03', '2026-08-04'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(result.errorCount).toBe(1);
    expect(result.createdOrUpdated).toBe(1);
    expect(result.errors[0]?.reason).toContain('no encontrado');
  });

  it('colaborador fuera de scope genera excluded, no error', async () => {
    assignmentsService.resolveScope.mockResolvedValue(['loc-2']);

    const buffer = await buildWorkbookBuffer(
      [{ documento: '', nombre: '', employeeId: 'emp-1', '2026-08-03': 'TM' }],
      ['2026-08-03'],
    );

    const result = await service.importFromExcel(tenantId, supervisorActor, buffer);

    expect(result.excluded).toBe(1);
    expect(result.errorCount).toBe(0);
    expect(result.errors[0]?.reason).toBe(SCOPE_FORBIDDEN_MESSAGE);
    expect(assignmentsService.assign).not.toHaveBeenCalled();
  });

  it('empleado no encontrado genera error de fila', async () => {
    assignmentsRepository.findEmployeeScope.mockImplementation((_tenantId, id) =>
      Promise.resolve(id === 'emp-2' ? { id: 'emp-2', locationId: 'loc-1', isActive: true } : null),
    );
    assignmentsRepository.findEmployeeByDocument.mockResolvedValue(null);

    const buffer = await buildWorkbookBuffer(
      [
        { documento: '999', nombre: '', employeeId: '', '2026-08-03': 'TM' },
        { documento: '', nombre: '', employeeId: 'emp-2', '2026-08-03': 'TM' },
      ],
      ['2026-08-03'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(result.errorCount).toBe(1);
    expect(result.createdOrUpdated).toBe(1);
    expect(result.errors[0]?.reason).toBe('Colaborador no encontrado');
  });

  it('empleado inactivo genera error de fila (no procesa sus fechas)', async () => {
    assignmentsRepository.findEmployeeScope.mockImplementation((_tenantId, id) =>
      Promise.resolve(
        id === 'emp-2'
          ? { id: 'emp-2', locationId: 'loc-1', isActive: true }
          : { ...employeeScope, isActive: false },
      ),
    );

    const buffer = await buildWorkbookBuffer(
      [
        { documento: '', nombre: '', employeeId: 'emp-1', '2026-08-03': 'TM' },
        { documento: '', nombre: '', employeeId: 'emp-2', '2026-08-03': 'TM' },
      ],
      ['2026-08-03'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(result.errorCount).toBe(1);
    expect(result.createdOrUpdated).toBe(1);
    expect(result.errors[0]?.reason).toBe('Colaborador inactivo');
    expect(assignmentsService.assign).toHaveBeenCalledTimes(1);
  });

  it('retorna 400 con detalle si todas las filas fallan', async () => {
    turnosRepository.findBySigla.mockResolvedValue(null);

    const buffer = await buildWorkbookBuffer(
      [{ documento: '', nombre: '', employeeId: 'emp-1', '2026-08-03': 'XYZ' }],
      ['2026-08-03'],
    );

    await expect(service.importFromExcel(tenantId, ownerActor, buffer)).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({ errorCount: 1, totalAssignments: 0 }),
    });
  });

  it('rechaza si el archivo supera el máximo de asignaciones procesables', async () => {
    // 200 columnas de fecha únicas x 30 filas = 6000 celdas accionables > límite de 5000.
    const uniqueDateHeaders = Array.from({ length: 200 }, (_, index): string => {
      const day = (index % 28) + 1;
      const month = Math.floor(index / 28) + 1;
      return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    });
    const manyRows = Array.from({ length: 30 }, (): Record<string, string> => {
      const rowData: Record<string, string> = { documento: '', nombre: '', employeeId: 'emp-1' };
      uniqueDateHeaders.forEach((header): void => {
        rowData[header] = 'TM';
      });
      return rowData;
    });

    const buffer = await buildWorkbookBuffer(manyRows, uniqueDateHeaders);

    await expect(service.importFromExcel(tenantId, ownerActor, buffer)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('propaga turno inactivo como error parcial', async () => {
    turnosRepository.findBySigla.mockImplementation((_tenantId, sigla) =>
      Promise.resolve(
        sigla === 'TM_INACTIVE'
          ? { ...activeTurno, sigla: 'TM_INACTIVE', estado: false }
          : activeTurno,
      ),
    );

    const buffer = await buildWorkbookBuffer(
      [
        {
          documento: '',
          nombre: '',
          employeeId: 'emp-1',
          '2026-08-03': 'TM_INACTIVE',
          '2026-08-04': 'TM',
        },
      ],
      ['2026-08-03', '2026-08-04'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(result.errorCount).toBe(1);
    expect(result.createdOrUpdated).toBe(1);
    expect(result.errors[0]?.reason).toContain('inactivo');
  });

  it('clasifica ConflictException de assign() como error, no como excluded', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await -- el throw necesita convertirse en rejection
    assignmentsService.assign.mockImplementation(async (_tenantId, _actor, input) => {
      if (input.workDate === '2026-08-03') {
        throw new ConflictException('turno inactivo');
      }
      return {
        id: 'assignment-ok',
        tenantId,
        employeeId: 'emp-1',
        turnoId: 'turno-1',
        workDate: new Date(`${input.workDate}T00:00:00.000Z`),
        type: TurnoAssignmentType.ASSIGNED,
        createdByUserId: null,
        updatedByUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        turno: null,
      };
    });

    const buffer = await buildWorkbookBuffer(
      [
        {
          documento: '',
          nombre: '',
          employeeId: 'emp-1',
          '2026-08-03': 'TM',
          '2026-08-04': 'TM',
        },
      ],
      ['2026-08-03', '2026-08-04'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(result.errorCount).toBe(1);
    expect(result.excluded).toBe(0);
    expect(result.createdOrUpdated).toBe(1);
  });

  it('clasifica NotFoundException de assign() como error', async () => {
    assignmentsService.assign.mockRejectedValue(new NotFoundException('turno no encontrado'));
    assignmentsRepository.findByEmployeeAndDate.mockResolvedValue({
      id: 'assignment-existing',
      tenantId,
      employeeId: 'emp-1',
      turnoId: 'turno-1',
      workDate: new Date('2026-08-04T00:00:00.000Z'),
      type: TurnoAssignmentType.ASSIGNED,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: null,
    });

    const buffer = await buildWorkbookBuffer(
      [
        {
          documento: '',
          nombre: '',
          employeeId: 'emp-1',
          '2026-08-03': 'TM',
          '2026-08-04': 'BASE',
        },
      ],
      ['2026-08-03', '2026-08-04'],
    );

    const result = await service.importFromExcel(tenantId, ownerActor, buffer);

    expect(result.errorCount).toBe(1);
    expect(result.returnedToBase).toBe(1);
  });
});
