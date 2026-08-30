import { AuditAction, TurnoAssignmentType, TurnoJornada, TurnoTipo } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';

const TENANT = 'tenant-1';
const USER = 'user-1';

const assignmentRow = {
  id: 'assignment-1',
  tenantId: TENANT,
  turnoId: 'turno-1',
  employeeId: 'emp-1',
  workDate: new Date('2026-07-06T00:00:00.000Z'),
  type: TurnoAssignmentType.ASSIGNED,
  createdByUserId: USER,
  updatedByUserId: USER,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  turno: {
    id: 'turno-1',
    nombre: 'Turno mañana',
    sigla: 'TM',
    horaInicio: '06:00',
    horaFin: '14:00',
    jornada: TurnoJornada.DIURNO,
  },
};

describe('TurnoAssignmentsRepository', () => {
  const prismaMock = {
    employeeDetails: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    turno: {
      findFirst: jest.fn(),
    },
    turnoAssignment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let repository: TurnoAssignmentsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TurnoAssignmentsRepository(prismaMock as unknown as PrismaService);
  });

  describe('findActiveEmployeesPage', () => {
    it('filtra por tenantId, isActive y deletedAt null', async () => {
      prismaMock.employeeDetails.count.mockResolvedValue(1);
      prismaMock.employeeDetails.findMany.mockResolvedValue([
        {
          id: 'emp-1',
          userId: 'user-emp-1',
          name: 'Ana',
          locationId: 'loc-1',
          user: { cedula: '123' },
        },
      ]);

      const result = await repository.findActiveEmployeesPage(TENANT, { page: 1, limit: 20 });

      expect(prismaMock.employeeDetails.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ tenantId: TENANT, deletedAt: null, isActive: true }),
      });
      expect(result.employees[0]).toMatchObject({ id: 'emp-1', documento: '123' });
    });

    it('restringe por allowedLocationIds cuando se provee', async () => {
      prismaMock.employeeDetails.count.mockResolvedValue(0);
      prismaMock.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findActiveEmployeesPage(TENANT, {
        page: 1,
        limit: 20,
        allowedLocationIds: ['loc-1'],
      });

      expect(prismaMock.employeeDetails.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ locationId: { in: ['loc-1'] } }),
      });
    });

    it('busca por documento cuando field es documento', async () => {
      prismaMock.employeeDetails.count.mockResolvedValue(0);
      prismaMock.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findActiveEmployeesPage(TENANT, {
        page: 1,
        limit: 20,
        search: '123',
        field: 'documento',
      });

      expect(prismaMock.employeeDetails.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user: { cedula: { contains: '123', mode: 'insensitive' } },
        }),
      });
    });

    it('busca por nombre u documento (OR) cuando no se especifica field', async () => {
      prismaMock.employeeDetails.count.mockResolvedValue(0);
      prismaMock.employeeDetails.findMany.mockResolvedValue([]);

      await repository.findActiveEmployeesPage(TENANT, { page: 1, limit: 20, search: 'ana' });

      expect(prismaMock.employeeDetails.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'ana', mode: 'insensitive' } },
            { user: { cedula: { contains: 'ana', mode: 'insensitive' } } },
          ],
        }),
      });
    });
  });

  describe('finders individuales', () => {
    it('findById retorna la asignación mapeada', async () => {
      prismaMock.turnoAssignment.findFirst.mockResolvedValue(assignmentRow);

      const result = await repository.findById(TENANT, 'assignment-1');

      expect(prismaMock.turnoAssignment.findFirst).toHaveBeenCalledWith({
        where: { id: 'assignment-1', tenantId: TENANT },
        include: { turno: true },
      });
      expect(result?.turno?.sigla).toBe('TM');
    });

    it('findById retorna null si no existe', async () => {
      prismaMock.turnoAssignment.findFirst.mockResolvedValue(null);

      const result = await repository.findById(TENANT, 'missing');

      expect(result).toBeNull();
    });

    it('findByEmployeeAndDate retorna la asignación del día', async () => {
      prismaMock.turnoAssignment.findFirst.mockResolvedValue(assignmentRow);

      const result = await repository.findByEmployeeAndDate(
        TENANT,
        'emp-1',
        new Date('2026-07-06T00:00:00.000Z'),
      );

      expect(result?.employeeId).toBe('emp-1');
    });

    it('findEmployeeScope retorna id/locationId/isActive del colaborador', async () => {
      prismaMock.employeeDetails.findFirst.mockResolvedValue({
        id: 'emp-1',
        locationId: 'loc-1',
        isActive: true,
      });

      const result = await repository.findEmployeeScope(TENANT, 'emp-1');

      expect(prismaMock.employeeDetails.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', tenantId: TENANT, deletedAt: null },
        select: { id: true, locationId: true, isActive: true },
      });
      expect(result).toEqual({ id: 'emp-1', locationId: 'loc-1', isActive: true });
    });

    it('findTurnoScope retorna los campos del turno', async () => {
      prismaMock.turno.findFirst.mockResolvedValue({
        id: 'turno-1',
        nombre: 'Turno mañana',
        sigla: 'TM',
        horaInicio: '06:00',
        horaFin: '14:00',
        jornada: TurnoJornada.DIURNO,
        tipo: TurnoTipo.PERMANENTE,
        estado: true,
      });

      const result = await repository.findTurnoScope(TENANT, 'turno-1');

      expect(result?.estado).toBe(true);
    });
  });

  describe('findAssignmentsForEmployeesInRange', () => {
    it('retorna vacío sin consultar prisma si no hay employeeIds', async () => {
      const result = await repository.findAssignmentsForEmployeesInRange(
        TENANT,
        [],
        new Date(),
        new Date(),
      );

      expect(result).toEqual([]);
      expect(prismaMock.turnoAssignment.findMany).not.toHaveBeenCalled();
    });

    it('mapea filas incluyendo el turno', async () => {
      prismaMock.turnoAssignment.findMany.mockResolvedValue([assignmentRow]);

      const result = await repository.findAssignmentsForEmployeesInRange(
        TENANT,
        ['emp-1'],
        new Date('2026-07-06'),
        new Date('2026-07-12'),
      );

      expect(result[0]?.turno?.sigla).toBe('TM');
    });
  });

  describe('upsertWithAudit', () => {
    it('hace upsert por tenantId+employeeId+workDate y registra AuditLog ASSIGN', async () => {
      const txUpsert = jest.fn().mockResolvedValue(assignmentRow);
      const txAuditCreate = jest.fn().mockResolvedValue({});

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            turnoAssignment: { upsert: txUpsert },
            auditLog: { create: txAuditCreate },
          }),
      );

      const result = await repository.upsertWithAudit(
        TENANT,
        {
          employeeId: 'emp-1',
          workDate: new Date('2026-07-06T00:00:00.000Z'),
          type: TurnoAssignmentType.ASSIGNED,
          turnoId: 'turno-1',
        },
        USER,
        { oldValue: { turnoId: null }, newValue: { turnoId: 'turno-1' } },
      );

      expect(txUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_employeeId_workDate: {
              tenantId: TENANT,
              employeeId: 'emp-1',
              workDate: new Date('2026-07-06T00:00:00.000Z'),
            },
          },
        }),
      );
      expect(txAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.ASSIGN,
            entityType: 'TurnoAssignment',
          }),
        }),
      );
      expect(result.id).toBe('assignment-1');
    });

    it('revierte si auditLog.create falla', async () => {
      const txUpsert = jest.fn().mockResolvedValue(assignmentRow);
      const txAuditCreate = jest.fn().mockRejectedValue(new Error('audit failed'));

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            turnoAssignment: { upsert: txUpsert },
            auditLog: { create: txAuditCreate },
          }),
      );

      await expect(
        repository.upsertWithAudit(
          TENANT,
          {
            employeeId: 'emp-1',
            workDate: new Date('2026-07-06T00:00:00.000Z'),
            type: TurnoAssignmentType.ASSIGNED,
            turnoId: 'turno-1',
          },
          USER,
          { oldValue: null, newValue: null },
        ),
      ).rejects.toThrow('audit failed');
    });
  });

  describe('deleteWithAudit', () => {
    it('elimina la fila (hard delete) y registra AuditLog ASSIGN', async () => {
      const txDelete = jest.fn().mockResolvedValue(assignmentRow);
      const txAuditCreate = jest.fn().mockResolvedValue({});

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) =>
          callback({
            turnoAssignment: { delete: txDelete },
            auditLog: { create: txAuditCreate },
          }),
      );

      await repository.deleteWithAudit(TENANT, 'assignment-1', USER, {
        oldValue: { turnoId: 'turno-1' },
        newValue: null,
      });

      expect(txDelete).toHaveBeenCalledWith({ where: { id: 'assignment-1' } });
      expect(txAuditCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: AuditAction.ASSIGN, entityId: 'assignment-1' }),
        }),
      );
    });
  });

  describe('findEmployeesByIds (OS-583)', () => {
    it('retorna vacío sin consultar prisma si no hay ids', async () => {
      const result = await repository.findEmployeesByIds(TENANT, []);

      expect(result).toEqual([]);
      expect(prismaMock.employeeDetails.findMany).not.toHaveBeenCalled();
    });

    it('mapea empleados con documento e isActive', async () => {
      prismaMock.employeeDetails.findMany.mockResolvedValue([
        {
          id: 'emp-1',
          userId: 'user-1',
          name: 'Ana Pérez',
          locationId: 'loc-1',
          isActive: true,
          user: { cedula: '123' },
        },
      ]);

      const result = await repository.findEmployeesByIds(TENANT, ['emp-1']);

      expect(prismaMock.employeeDetails.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT, deletedAt: null, id: { in: ['emp-1'] } },
        }),
      );
      expect(result).toEqual([
        {
          id: 'emp-1',
          userId: 'user-1',
          nombre: 'Ana Pérez',
          documento: '123',
          locationId: 'loc-1',
          isActive: true,
        },
      ]);
    });
  });

  describe('findEmployeeByDocument (OS-583)', () => {
    it('busca por cedula del usuario asociado', async () => {
      prismaMock.employeeDetails.findFirst.mockResolvedValue({
        id: 'emp-1',
        locationId: 'loc-1',
        isActive: true,
      });

      const result = await repository.findEmployeeByDocument(TENANT, '123456');

      expect(prismaMock.employeeDetails.findFirst).toHaveBeenCalledWith({
        where: { tenantId: TENANT, deletedAt: null, user: { cedula: '123456' } },
        select: { id: true, locationId: true, isActive: true },
      });
      expect(result?.id).toBe('emp-1');
    });

    it('retorna null si no existe', async () => {
      prismaMock.employeeDetails.findFirst.mockResolvedValue(null);

      const result = await repository.findEmployeeByDocument(TENANT, 'missing');

      expect(result).toBeNull();
    });
  });

  describe('logTemplateExportAudit (OS-583)', () => {
    it('registra AuditLog EXPORT para la entidad TurnoAssignment', async () => {
      await repository.logTemplateExportAudit(TENANT, USER, { employeeCount: 3 });

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT,
          action: AuditAction.EXPORT,
          entityType: 'TurnoAssignment',
          actorUserId: USER,
          payload: { employeeCount: 3 },
        }),
      });
    });
  });
});
