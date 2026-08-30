import { AuditAction, TurnoJornada, TurnoTipo } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import { TurnosRepository } from '../repository/turnos.repository';

const TENANT = 'tenant-1';
const USER = 'user-1';

const baseRow = {
  id: 'turno-1',
  tenantId: TENANT,
  locationId: 'loc-1',
  nombre: 'Turno mañana',
  sigla: 'TM',
  tipo: TurnoTipo.PERMANENTE,
  jornada: TurnoJornada.DIURNO,
  horaInicio: '06:00',
  horaFin: '14:00',
  daysOfWeek: [1, 2, 3, 4, 5],
  estado: true,
  createdByUserId: USER,
  updatedByUserId: USER,
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
};

describe('TurnosRepository', () => {
  const prismaMock = {
    turno: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    turnoAssignment: {
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let repository: TurnosRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TurnosRepository(prismaMock as unknown as PrismaService);
  });

  describe('findMany', () => {
    it('pagina resultados y calcula totalPages', async () => {
      prismaMock.turno.count.mockResolvedValue(25);
      prismaMock.turno.findMany.mockResolvedValue([baseRow]);

      const result = await repository.findMany(TENANT, { page: 2, limit: 10 });

      expect(prismaMock.turno.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.pagination).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
      expect(result.data[0]?.sigla).toBe('TM');
    });

    it('aplica filtros de estado, nombre, sigla, tipo, jornada y búsqueda', async () => {
      prismaMock.turno.count.mockResolvedValue(0);
      prismaMock.turno.findMany.mockResolvedValue([]);

      await repository.findMany(TENANT, {
        estado: true,
        nombre: 'mañana',
        sigla: 'tm',
        tipo: TurnoTipo.PERMANENTE,
        jornada: TurnoJornada.DIURNO,
        search: 'PERMANENTE',
      });

      expect(prismaMock.turno.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { tenantId: TENANT },
              { estado: true },
              { nombre: { contains: 'mañana', mode: 'insensitive' } },
              { sigla: { contains: 'tm', mode: 'insensitive' } },
              { tipo: TurnoTipo.PERMANENTE },
              { jornada: TurnoJornada.DIURNO },
              {
                OR: expect.arrayContaining([
                  { nombre: { contains: 'PERMANENTE', mode: 'insensitive' } },
                  { sigla: { contains: 'PERMANENTE', mode: 'insensitive' } },
                  { tipo: TurnoTipo.PERMANENTE },
                ]),
              },
            ]),
          }),
        }),
      );
    });
  });

  describe('findAllFiltered', () => {
    it('retorna turnos mapeados', async () => {
      prismaMock.turno.findMany.mockResolvedValue([baseRow]);

      const result = await repository.findAllFiltered(TENANT, { estado: false });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('turno-1');
    });
  });

  describe('findById', () => {
    it('retorna null si no existe', async () => {
      prismaMock.turno.findFirst.mockResolvedValue(null);

      await expect(repository.findById(TENANT, 'missing')).resolves.toBeNull();
    });

    it('retorna turno mapeado si existe', async () => {
      prismaMock.turno.findFirst.mockResolvedValue(baseRow);

      const result = await repository.findById(TENANT, 'turno-1');

      expect(result?.nombre).toBe('Turno mañana');
    });
  });

  describe('findBySigla', () => {
    it('retorna null si no existe', async () => {
      prismaMock.turno.findFirst.mockResolvedValue(null);

      await expect(repository.findBySigla(TENANT, 'XX')).resolves.toBeNull();
    });
  });

  describe('countFutureAssignments', () => {
    it('cuenta asignaciones desde la fecha indicada', async () => {
      const fromDate = new Date('2026-06-10T00:00:00.000Z');
      prismaMock.turnoAssignment.count.mockResolvedValue(2);

      const result = await repository.countFutureAssignments(TENANT, 'turno-1', fromDate);

      expect(result).toBe(2);
      expect(prismaMock.turnoAssignment.count).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT,
          turnoId: 'turno-1',
          workDate: { gte: fromDate },
        },
      });
    });
  });

  describe('updateWithAudit', () => {
    it('actualiza turno y registra audit cuando hay cambios', async () => {
      const txTurnoUpdate = jest.fn().mockResolvedValue(baseRow);
      const txAuditCreate = jest.fn().mockResolvedValue({});

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            turno: { update: txTurnoUpdate },
            auditLog: { create: txAuditCreate },
          }),
      );

      const result = await repository.updateWithAudit(
        TENANT,
        'turno-1',
        {
          locationId: 'loc-1',
          nombre: 'Turno tarde',
          sigla: 'TT',
          tipo: TurnoTipo.VARIABLE,
          jornada: TurnoJornada.NOCTURNO,
          horaInicio: '14:00',
          horaFin: '22:00',
          daysOfWeek: [1, 2, 3, 4, 5],
        },
        USER,
        {
          oldValue: { nombre: 'Turno mañana' },
          newValue: { nombre: 'Turno tarde' },
        },
      );

      expect(result.sigla).toBe('TM');
      expect(txAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.UPDATE,
            entityType: 'Turno',
          }),
        }),
      );
    });

    it('omite audit si no hay cambios en newValue', async () => {
      const txTurnoUpdate = jest.fn().mockResolvedValue(baseRow);
      const txAuditCreate = jest.fn();

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            turno: { update: txTurnoUpdate },
            auditLog: { create: txAuditCreate },
          }),
      );

      await repository.updateWithAudit(
        TENANT,
        'turno-1',
        {
          locationId: 'loc-1',
          nombre: 'Turno mañana',
          sigla: 'TM',
          tipo: TurnoTipo.PERMANENTE,
          jornada: TurnoJornada.DIURNO,
          horaInicio: '06:00',
          horaFin: '14:00',
          daysOfWeek: [1, 2, 3, 4, 5],
        },
        USER,
        { oldValue: {}, newValue: {} },
      );

      expect(txAuditCreate).not.toHaveBeenCalled();
    });

    it('lanza error si tenantId no coincide después del update', async () => {
      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            turno: {
              update: jest.fn().mockResolvedValue({ ...baseRow, tenantId: 'other-tenant' }),
            },
            auditLog: { create: jest.fn() },
          }),
      );

      await expect(
        repository.updateWithAudit(
          TENANT,
          'turno-1',
          {
            locationId: 'loc-1',
            nombre: 'Turno tarde',
            sigla: 'TT',
            tipo: TurnoTipo.VARIABLE,
            jornada: TurnoJornada.NOCTURNO,
            horaInicio: '14:00',
            horaFin: '22:00',
            daysOfWeek: [1, 2, 3, 4, 5],
          },
          USER,
          { oldValue: {}, newValue: { nombre: 'Turno tarde' } },
        ),
      ).rejects.toThrow('Tenant mismatch after update');
    });
  });

  describe('updateEstadoWithAudit', () => {
    it('actualiza estado y registra audit', async () => {
      const txTurnoUpdate = jest.fn().mockResolvedValue({ ...baseRow, estado: false });
      const txAuditCreate = jest.fn().mockResolvedValue({});

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            turno: { update: txTurnoUpdate },
            auditLog: { create: txAuditCreate },
          }),
      );

      const result = await repository.updateEstadoWithAudit(TENANT, 'turno-1', false, USER, {
        oldValue: { estado: true },
        newValue: { estado: false },
      });

      expect(result.estado).toBe(false);
      expect(txAuditCreate).toHaveBeenCalled();
    });
  });

  describe('logExportAudit', () => {
    it('registra audit de exportación', async () => {
      prismaMock.auditLog.create.mockResolvedValue({});

      await repository.logExportAudit(TENANT, USER, { rowCount: 3 });

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT,
          action: AuditAction.EXPORT,
          entityType: 'Turno',
          actorUserId: USER,
          payload: { rowCount: 3 },
        }),
      });
    });
  });
});

describe('TurnosRepository transactional audit', () => {
  it('revierte creación si auditLog.create falla', async (): Promise<void> => {
    const txTurnoCreate = jest.fn().mockResolvedValue({
      id: 'turno-1',
      tenantId: 'tenant-1',
      nombre: 'Turno',
      sigla: 'T1',
      tipo: 'PERMANENTE',
      jornada: 'DIURNO',
      horaInicio: '06:00',
      horaFin: '14:00',
      estado: true,
      createdByUserId: 'user-1',
      updatedByUserId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const txAuditCreate = jest.fn().mockRejectedValue(new Error('audit failed'));

    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          turno: { create: txTurnoCreate },
          auditLog: { create: txAuditCreate },
        }),
      ),
    } as unknown as PrismaService;

    const repository = new TurnosRepository(prisma);

    await expect(
      repository.createWithAudit(
        'tenant-1',
        {
          locationId: 'loc-1',
          nombre: 'Turno',
          sigla: 'T1',
          tipo: 'PERMANENTE',
          jornada: 'DIURNO',
          horaInicio: '06:00',
          horaFin: '14:00',
          daysOfWeek: [1, 2, 3, 4, 5],
        },
        'user-1',
        { nombre: 'Turno' },
      ),
    ).rejects.toThrow('audit failed');

    expect(txTurnoCreate).toHaveBeenCalled();
    expect(txAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: AuditAction.CREATE,
          entityType: 'Turno',
        }),
      }),
    );
  });
});
