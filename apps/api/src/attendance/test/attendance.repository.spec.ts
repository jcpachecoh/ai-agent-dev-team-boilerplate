import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceEventType, AttendanceShift, LaborClassification } from '@prisma/client';
import { AttendanceRepository, normalizeWorkDate } from '../repository/attendance.repository';
import { PrismaService } from '../../prisma/prisma.service';

// ── PrismaService mock ────────────────────────────────────────────────────────

const prismaMock = {
  attendanceLog: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  mobileAttendanceLog: {
    findMany: jest.fn(),
  },
  alertDismissal: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  user: { findFirst: jest.fn() },
  employeeDetails: { findFirst: jest.fn() },
};

const TENANT = 'test-tenant';
const EMPLOYEE_ID = 'emp-repo-001';
const LOCATION_ID = 'loc-repo-001';
const WORK_DATE = new Date('2026-06-10T00:00:00.000Z');

function makeLog(
  id: string,
  eventType: AttendanceEventType,
  timestamp: Date,
  workDate = WORK_DATE,
) {
  return {
    id,
    tenantId: TENANT,
    employeeId: EMPLOYEE_ID,
    locationId: LOCATION_ID,
    eventType,
    shift: AttendanceShift.MORNING,
    timestamp,
    workDate,
    notes: null,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('AttendanceRepository', () => {
  let repo: AttendanceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repo = module.get<AttendanceRepository>(AttendanceRepository);
    jest.clearAllMocks();
  });

  // ── normalizeWorkDate ─────────────────────────────────────────────────────

  describe('normalizeWorkDate', () => {
    it('normaliza a medianoche UTC para la fecha Bogotá cuando la hora es tarde UTC', () => {
      // 2026-06-10 20:00 UTC = 2026-06-10 15:00 Bogotá → workDate = 2026-06-10
      const result = normalizeWorkDate(new Date('2026-06-10T20:00:00.000Z'));
      expect(result).toEqual(new Date('2026-06-10T00:00:00.000Z'));
    });

    it('cruce de medianoche Bogotá: 04:00 UTC = 23:00 Bogotá del día anterior', () => {
      // 2026-06-11 04:00 UTC = 2026-06-10 23:00 Bogotá → workDate = 2026-06-10
      const result = normalizeWorkDate(new Date('2026-06-11T04:00:00.000Z'));
      expect(result).toEqual(new Date('2026-06-10T00:00:00.000Z'));
    });

    it('normaliza hora matutina Bogotá: 06:00 UTC = 01:00 Bogotá → workDate del mismo día UTC', () => {
      // 2026-06-11 06:00 UTC = 2026-06-11 01:00 Bogotá → workDate = 2026-06-11
      const result = normalizeWorkDate(new Date('2026-06-11T06:00:00.000Z'));
      expect(result).toEqual(new Date('2026-06-11T00:00:00.000Z'));
    });
  });

  // ── findOpenEntry ─────────────────────────────────────────────────────────

  describe('findOpenEntry', () => {
    it('retorna null cuando no hay ninguna ENTRY para el empleado', async () => {
      prismaMock.attendanceLog.findFirst.mockResolvedValueOnce(null);

      const result = await repo.findOpenEntry(EMPLOYEE_ID);

      expect(result).toBeNull();
      expect(prismaMock.attendanceLog.findFirst).toHaveBeenCalledTimes(1);
    });

    it('retorna null cuando hay ENTRY pero también existe EXIT después de ella', async () => {
      const entryTs = new Date('2026-06-10T13:00:00.000Z');
      const exitTs = new Date('2026-06-10T21:00:00.000Z');
      const lastEntry = makeLog('log-entry', AttendanceEventType.ENTRY, entryTs);
      const exitAfter = makeLog('log-exit', AttendanceEventType.EXIT, exitTs);

      // First findFirst → last ENTRY
      prismaMock.attendanceLog.findFirst.mockResolvedValueOnce(lastEntry);
      // Second findFirst → EXIT after that ENTRY (entry is closed)
      prismaMock.attendanceLog.findFirst.mockResolvedValueOnce(exitAfter);

      const result = await repo.findOpenEntry(EMPLOYEE_ID);

      expect(result).toBeNull();
    });

    it('retorna la última ENTRY cuando no existe EXIT posterior (entrada abierta)', async () => {
      const entryTs = new Date('2026-06-10T13:00:00.000Z');
      const lastEntry = makeLog('log-open', AttendanceEventType.ENTRY, entryTs);

      prismaMock.attendanceLog.findFirst.mockResolvedValueOnce(lastEntry);
      // No EXIT after the entry
      prismaMock.attendanceLog.findFirst.mockResolvedValueOnce(null);

      const result = await repo.findOpenEntry(EMPLOYEE_ID);

      expect(result).toEqual(lastEntry);
    });
  });

  // ── findAllForDay ─────────────────────────────────────────────────────────

  describe('findAllForDay', () => {
    it('llama a prisma con workDate y ordena por timestamp ASC', async () => {
      const ts1 = new Date('2026-06-10T13:00:00.000Z');
      const ts2 = new Date('2026-06-10T21:00:00.000Z');
      const logs = [
        makeLog('log-a', AttendanceEventType.ENTRY, ts1),
        makeLog('log-b', AttendanceEventType.EXIT, ts2),
      ];

      prismaMock.attendanceLog.findMany.mockResolvedValueOnce(logs);

      const result = await repo.findAllForDay(EMPLOYEE_ID, WORK_DATE);

      expect(prismaMock.attendanceLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ employeeId: EMPLOYEE_ID, workDate: WORK_DATE }),
          orderBy: { timestamp: 'asc' },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('log-a');
      expect(result[1].id).toBe('log-b');
    });
  });

  // ── findUserByCedula ──────────────────────────────────────────────────────

  describe('findUserByCedula', () => {
    it('delega al prisma con cedula y tenantId correctos', async () => {
      const user = { id: 'user-1', cedula: '12345678', tenantId: TENANT };
      prismaMock.user.findFirst.mockResolvedValueOnce(user);

      const result = await repo.findUserByCedula('12345678', TENANT);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cedula: '12345678', tenantId: TENANT }),
        }),
      );
      expect(result).toEqual(user);
    });
  });

  // ── findEmployeeByUserAndLocation ─────────────────────────────────────────

  describe('findEmployeeByUserAndLocation', () => {
    it('delega al prisma con userId, locationId y tenantId', async () => {
      prismaMock.employeeDetails.findFirst.mockResolvedValueOnce(null);

      const result = await repo.findEmployeeByUserAndLocation('user-1', LOCATION_ID, TENANT);

      expect(prismaMock.employeeDetails.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            locationId: LOCATION_ID,
            tenantId: TENANT,
          }),
        }),
      );
      expect(result).toBeNull();
    });
  });

  // ── findEmployeeByUserId ──────────────────────────────────────────────────

  describe('findEmployeeByUserId', () => {
    it('delega al prisma con userId y tenantId', async () => {
      prismaMock.employeeDetails.findFirst.mockResolvedValueOnce(null);

      const result = await repo.findEmployeeByUserId('user-1', TENANT);

      expect(prismaMock.employeeDetails.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1', tenantId: TENANT }),
        }),
      );
      expect(result).toBeNull();
    });
  });

  // ── listHistory ───────────────────────────────────────────────────────────

  describe('listHistory', () => {
    it('sin filtros opcionales: only tenantId y isActive en where', async () => {
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listHistory({ tenantId: TENANT });

      const call = prismaMock.attendanceLog.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('employeeId');
      expect(call.where).not.toHaveProperty('locationId');
      expect(call.where).not.toHaveProperty('workDate');
      expect(call.take).toBe(500);
      expect(call.skip).toBe(0);
    });

    it('con employeeId: agrega filtro al where', async () => {
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listHistory({ tenantId: TENANT, employeeId: EMPLOYEE_ID });

      const call = prismaMock.attendanceLog.findMany.mock.calls[0][0];
      expect(call.where.employeeId).toBe(EMPLOYEE_ID);
    });

    it('con locationId: agrega filtro al where', async () => {
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listHistory({ tenantId: TENANT, locationId: LOCATION_ID });

      const call = prismaMock.attendanceLog.findMany.mock.calls[0][0];
      expect(call.where.locationId).toBe(LOCATION_ID);
    });

    it('con dateFrom y dateTo: agrega workDate gte+lte al where', async () => {
      const from = new Date('2026-06-01T00:00:00.000Z');
      const to = new Date('2026-06-10T00:00:00.000Z');
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listHistory({ tenantId: TENANT, dateFrom: from, dateTo: to });

      const call = prismaMock.attendanceLog.findMany.mock.calls[0][0];
      expect(call.where.workDate).toEqual({ gte: from, lte: to });
    });

    it('con solo dateFrom: agrega workDate.gte sin lte', async () => {
      const from = new Date('2026-06-01T00:00:00.000Z');
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listHistory({ tenantId: TENANT, dateFrom: from });

      const call = prismaMock.attendanceLog.findMany.mock.calls[0][0];
      expect(call.where.workDate.gte).toEqual(from);
      expect(call.where.workDate.lte).toBeUndefined();
    });

    it('con solo dateTo: agrega workDate.lte sin gte', async () => {
      const to = new Date('2026-06-10T00:00:00.000Z');
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listHistory({ tenantId: TENANT, dateTo: to });

      const call = prismaMock.attendanceLog.findMany.mock.calls[0][0];
      expect(call.where.workDate.lte).toEqual(to);
      expect(call.where.workDate.gte).toBeUndefined();
    });

    it('respeta limit y offset custom', async () => {
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listHistory({ tenantId: TENANT, limit: 10, offset: 5 });

      const call = prismaMock.attendanceLog.findMany.mock.calls[0][0];
      expect(call.take).toBe(10);
      expect(call.skip).toBe(5);
    });
  });

  // ── listActiveAtLocation ──────────────────────────────────────────────────

  describe('listActiveAtLocation', () => {
    it('retorna array vacío cuando no hay logs hoy', async () => {
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      const result = await repo.listActiveAtLocation(LOCATION_ID, TENANT);

      expect(result).toEqual([]);
    });

    it('retorna solo empleados cuyo último log del día es ENTRY', async () => {
      const ts1 = new Date('2026-06-10T13:00:00.000Z');
      const ts2 = new Date('2026-06-10T21:00:00.000Z');
      // emp-a: ENTRY then EXIT → last is EXIT → should NOT be active
      const entryA = {
        ...makeLog('e-a', AttendanceEventType.ENTRY, ts1),
        employeeId: 'emp-a',
        employee: {},
        location: {},
      };
      const exitA = {
        ...makeLog('x-a', AttendanceEventType.EXIT, ts2),
        employeeId: 'emp-a',
        employee: {},
        location: {},
      };
      // emp-b: only ENTRY → still active
      const entryB = {
        ...makeLog('e-b', AttendanceEventType.ENTRY, ts1),
        employeeId: 'emp-b',
        employee: {},
        location: {},
      };

      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([entryA, exitA, entryB]);

      const result = await repo.listActiveAtLocation(LOCATION_ID, TENANT);

      // emp-a's last log is EXIT → excluded; emp-b's last log is ENTRY → included
      expect(result).toHaveLength(1);
      expect(result[0].employeeId).toBe('emp-b');
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('delega al prisma con id y tenantId', async () => {
      prismaMock.attendanceLog.findFirst.mockResolvedValueOnce(null);

      const result = await repo.findById('log-xyz', TENANT);

      expect(prismaMock.attendanceLog.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'log-xyz', tenantId: TENANT }),
        }),
      );
      expect(result).toBeNull();
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('persiste todos los campos obligatorios del AttendanceLog', async () => {
      const now = new Date();
      const data = {
        tenantId: TENANT,
        employeeId: EMPLOYEE_ID,
        locationId: LOCATION_ID,
        eventType: AttendanceEventType.ENTRY,
        shift: AttendanceShift.MORNING,
        workDate: WORK_DATE,
        notes: null as null,
      };
      const created = makeLog('log-created', AttendanceEventType.ENTRY, now);
      prismaMock.attendanceLog.create.mockResolvedValueOnce(created);

      const result = await repo.create(data);

      expect(prismaMock.attendanceLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT,
            employeeId: EMPLOYEE_ID,
            locationId: LOCATION_ID,
            eventType: AttendanceEventType.ENTRY,
            workDate: WORK_DATE,
          }),
        }),
      );
      expect(result.id).toBe('log-created');
    });
  });

  // ── listControlPanelLogs (OS-548 clasificacion filter) ──────────────────────

  describe('listControlPanelLogs', () => {
    it('sin laborClassifications: no agrega filtro de employee al where', async () => {
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listControlPanelLogs({ tenantId: TENANT });

      const call = prismaMock.attendanceLog.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('employee');
    });

    it('con laborClassifications: agrega where.employee.laborClassification.in', async () => {
      prismaMock.attendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listControlPanelLogs({
        tenantId: TENANT,
        laborClassifications: [LaborClassification.ADMINISTRATIVO],
      });

      const call = prismaMock.attendanceLog.findMany.mock.calls[0][0];
      expect(call.where.employee).toEqual({
        laborClassification: { in: [LaborClassification.ADMINISTRATIVO] },
      });
    });
  });

  // ── listMobileLogsForRange (OS-548 clasificacion filter) ─────────────────────

  describe('listMobileLogsForRange', () => {
    it('sin laborClassifications: no agrega filtro de employee al where', async () => {
      prismaMock.mobileAttendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listMobileLogsForRange(TENANT, WORK_DATE, WORK_DATE);

      const call = prismaMock.mobileAttendanceLog.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('employee');
    });

    it('con laborClassifications operaciones: filtra por COCINA y SERVICIO', async () => {
      prismaMock.mobileAttendanceLog.findMany.mockResolvedValueOnce([]);

      await repo.listMobileLogsForRange(TENANT, WORK_DATE, WORK_DATE, undefined, [
        LaborClassification.COCINA,
        LaborClassification.SERVICIO,
      ]);

      const call = prismaMock.mobileAttendanceLog.findMany.mock.calls[0][0];
      expect(call.where.employee).toEqual({
        laborClassification: { in: [LaborClassification.COCINA, LaborClassification.SERVICIO] },
      });
    });
  });

  // ── dismissAlert / listDismissedAlertKeys (OS-548) ──────────────────────────

  describe('dismissAlert', () => {
    it('hace upsert por la clave compuesta tenantId_userId_alertKey', async () => {
      const record = {
        id: 'dismiss-1',
        tenantId: TENANT,
        userId: 'user-1',
        alertKey: 'geo-log-1',
        dismissedAt: new Date('2026-07-02T10:00:00.000Z'),
        createdAt: new Date('2026-07-02T10:00:00.000Z'),
      };
      prismaMock.alertDismissal.upsert.mockResolvedValueOnce(record);

      const result = await repo.dismissAlert(TENANT, 'user-1', 'geo-log-1');

      expect(prismaMock.alertDismissal.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_userId_alertKey: { tenantId: TENANT, userId: 'user-1', alertKey: 'geo-log-1' },
        },
        update: { dismissedAt: expect.any(Date) },
        create: { tenantId: TENANT, userId: 'user-1', alertKey: 'geo-log-1' },
      });
      expect(result).toEqual(record);
    });
  });

  describe('listDismissedAlertKeys', () => {
    it('retorna un Set con las alertKey descartadas por ese tenant+usuario', async () => {
      prismaMock.alertDismissal.findMany.mockResolvedValueOnce([
        { alertKey: 'geo-log-1' },
        { alertKey: 'no-geo-log-2' },
      ]);

      const result = await repo.listDismissedAlertKeys(TENANT, 'user-1');

      expect(prismaMock.alertDismissal.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT, userId: 'user-1' },
        select: { alertKey: true },
      });
      expect(result).toEqual(new Set(['geo-log-1', 'no-geo-log-2']));
    });

    it('retorna un Set vacío cuando no hay descartes', async () => {
      prismaMock.alertDismissal.findMany.mockResolvedValueOnce([]);

      const result = await repo.listDismissedAlertKeys(TENANT, 'user-2');

      expect(result).toEqual(new Set());
    });
  });
});
