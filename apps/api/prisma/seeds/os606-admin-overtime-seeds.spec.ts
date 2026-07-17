/**
 * OS-606 / CONN-04b task-05 — pruebas focalizadas de seeds (motivos, permiso, demo).
 * Ejecutar: pnpm exec jest --config jest.seeds.config.js --runInBand
 */
import { EmployeeCatalogType, OvertimeRequestType, OvertimeStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

import {
  OS606_OVERTIME_REQUEST_ALL_ROLE_CODES,
  OS606_OVERTIME_REQUEST_ASSIGNED_ROLE_CODES,
  OS606_OVERTIME_REQUEST_CODES,
  OS606_OVERTIME_REQUEST_EXCLUDED_ROLE_CODES,
  OS606_OVERTIME_REQUEST_PERMISSION_SEED,
  OS606_SEDE_ADMIN_ROLE_CODE,
} from './os606-overtime-request-permission';
import {
  ADMIN_DEMO_BATCH_ID,
  ADMIN_REQUEST_IDS,
  seedAdministrativeOvertimeRequests,
} from './overtime-demo.seed';
import {
  OS606_OVERTIME_REASON_NAMES,
  OS606_OVERTIME_REASON_OPTION_IDS,
  OS606_OVERTIME_REASON_SEED_ROWS,
  OS606_OVERTIME_REASON_TENANT_ID,
  overtimeReasonCatalogOptionId,
  seedOvertimeReasonOptions,
} from './overtime-reason.seed';

describe('OS-606 task-05 — permiso attendance.overtime.request', () => {
  it('materializa el código e id estables', () => {
    expect(OS606_OVERTIME_REQUEST_PERMISSION_SEED.code).toBe('attendance.overtime.request');
    expect(OS606_OVERTIME_REQUEST_PERMISSION_SEED.id).toBe('cccccccc-0000-0000-0000-000000000082');
    expect(OS606_OVERTIME_REQUEST_CODES).toEqual(['attendance.overtime.request']);
  });

  it('confirma MANAGER como rol de Administrador de sede', () => {
    expect(OS606_SEDE_ADMIN_ROLE_CODE).toBe('MANAGER');
    expect(OS606_OVERTIME_REQUEST_ASSIGNED_ROLE_CODES).toEqual(['MANAGER']);
  });

  it('excluye NOMINA y SUPERVISOR (y no amplía P4)', () => {
    expect(OS606_OVERTIME_REQUEST_EXCLUDED_ROLE_CODES).toEqual(
      expect.arrayContaining(['NOMINA', 'SUPERVISOR']),
    );
    expect(OS606_OVERTIME_REQUEST_ASSIGNED_ROLE_CODES).not.toContain('NOMINA');
    expect(OS606_OVERTIME_REQUEST_ASSIGNED_ROLE_CODES).not.toContain('SUPERVISOR');
  });

  it('OWNER/SUPER_ADMIN poseen ALL pero quedan documentados aparte del rol sede', () => {
    expect(OS606_OVERTIME_REQUEST_ALL_ROLE_CODES).toEqual(['OWNER', 'SUPER_ADMIN']);
  });

  it('seed.ts asigna OVERTIME_REQUEST_CODES solo en bloque MANAGER (no NOMINA/SUPERVISOR)', () => {
    const seedPath = path.join(__dirname, '../seed.ts');
    const source = fs.readFileSync(seedPath, 'utf8');

    expect(source).toContain('OS606_OVERTIME_REQUEST_PERMISSION_SEED');
    expect(source).toContain('const OVERTIME_REQUEST_CODES = OS606_OVERTIME_REQUEST_CODES');

    const managerBlock = source.match(/MANAGER:\s*\[([\s\S]*?)\],\s*OPERATOR:/);
    expect(managerBlock?.[1]).toContain('...OVERTIME_REQUEST_CODES');

    const nominaBlock = source.match(/NOMINA:\s*\[([\s\S]*?)\],\s*\};/);
    expect(nominaBlock?.[1]).not.toContain('OVERTIME_REQUEST_CODES');

    const supervisorBlock = source.match(/SUPERVISOR:\s*\[([\s\S]*?)\],\s*MANAGER:/);
    expect(supervisorBlock?.[1]).not.toContain('OVERTIME_REQUEST_CODES');
  });
});

describe('OS-606 task-05 — catálogo OVERTIME_REASON', () => {
  it('define exactamente tres motivos con type OVERTIME_REASON y tenant demo', () => {
    expect(OS606_OVERTIME_REASON_NAMES).toHaveLength(3);
    expect([...OS606_OVERTIME_REASON_NAMES]).toEqual([
      'Inventario físico semana',
      'Inventario físico mensual',
      'Aseo',
    ]);
    expect(OS606_OVERTIME_REASON_TENANT_ID).toBe('palos-de-lena');
    for (const row of OS606_OVERTIME_REASON_SEED_ROWS) {
      expect(row.type).toBe(EmployeeCatalogType.OVERTIME_REASON);
      expect(row.tenantId).toBe('palos-de-lena');
      expect(row.pilaCode).toBeNull();
      expect(row.id).toBe(overtimeReasonCatalogOptionId(row.tenantId, row.name));
    }
  });

  it('IDs deterministas documentados (slug estable)', () => {
    expect(OS606_OVERTIME_REASON_OPTION_IDS.inventarioFisicoSemana).toBe(
      'seed-catalog-palos-de-lena-overtime_reason-inventario-fisico-semana',
    );
    expect(OS606_OVERTIME_REASON_OPTION_IDS.inventarioFisicoMensual).toBe(
      'seed-catalog-palos-de-lena-overtime_reason-inventario-fisico-mensual',
    );
    expect(OS606_OVERTIME_REASON_OPTION_IDS.aseo).toBe(
      'seed-catalog-palos-de-lena-overtime_reason-aseo',
    );
  });

  it('idempotencia: re-ejecutar upsert no fuerza isActive ni duplica creates', async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const count = jest.fn().mockResolvedValue(3);
    const prisma = {
      employeeCatalogOption: { upsert, count },
    } as never;

    await seedOvertimeReasonOptions(prisma);
    await seedOvertimeReasonOptions(prisma);

    expect(upsert).toHaveBeenCalledTimes(6);
    for (const call of upsert.mock.calls) {
      const args = call[0];
      expect(args.where.tenantId_type_name.type).toBe(EmployeeCatalogType.OVERTIME_REASON);
      expect(args.where.tenantId_type_name.tenantId).toBe('palos-de-lena');
      expect(args.create.isActive).toBe(true);
      expect(args.update).not.toHaveProperty('isActive');
      expect(args.create.pilaCode).toBeNull();
    }

    const names = upsert.mock.calls.map(
      (call: [{ where: { tenantId_type_name: { name: string } } }]) =>
        call[0].where.tenantId_type_name.name,
    );
    expect(names.filter((n: string) => n === 'Aseo')).toHaveLength(2);
  });

  it('no siembra fuera del tenant demo', async () => {
    const upsert = jest.fn();
    const prisma = { employeeCatalogOption: { upsert, count: jest.fn() } } as never;
    await seedOvertimeReasonOptions(prisma, 'otro-tenant');
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('OS-606 task-05 — demo SOLICITUD_ADMINISTRATIVA', () => {
  it('expone batchId e IDs estables del lote admin', () => {
    expect(ADMIN_DEMO_BATCH_ID).toBe('ffffffff-0000-0000-0000-000000000300');
    expect(Object.values(ADMIN_REQUEST_IDS)).toHaveLength(4);
  });

  it('siembra filas admin con detection null, motivo y requestedBy manager', async () => {
    const reasonRows = [
      { id: OS606_OVERTIME_REASON_OPTION_IDS.inventarioFisicoSemana },
      { id: OS606_OVERTIME_REASON_OPTION_IDS.inventarioFisicoMensual },
      { id: OS606_OVERTIME_REASON_OPTION_IDS.aseo },
    ];
    let reasonIdx = 0;

    const upsertRequest = jest.fn().mockResolvedValue({});
    const upsertApproval = jest.fn().mockResolvedValue({});
    const findFirstReason = jest.fn().mockImplementation(() => {
      const row = reasonRows[reasonIdx % reasonRows.length];
      reasonIdx += 1;
      return Promise.resolve(row);
    });

    const prisma = {
      employeeCatalogOption: {
        upsert: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(3),
        findFirst: findFirstReason,
      },
      employeeDetails: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'emp-op', userId: '11111111-0000-0000-0000-000000000005' },
          { id: 'emp-op2', userId: '11111111-0000-0000-0000-000000000006' },
          { id: 'emp-ops', userId: '11111111-0000-0000-0000-000000000007' },
          { id: 'emp-sup', userId: '11111111-0000-0000-0000-000000000010' },
        ]),
      },
      overtimeRequest: { upsert: upsertRequest },
      overtimeApproval: { upsert: upsertApproval },
    } as never;

    const workDate = new Date('2026-07-16T05:00:00.000Z');
    await seedAdministrativeOvertimeRequests(prisma, 'loc-pl01', '2026-07', workDate);
    await seedAdministrativeOvertimeRequests(prisma, 'loc-pl01', '2026-07', workDate);

    expect(upsertRequest).toHaveBeenCalledTimes(8);

    const statuses = upsertRequest.mock.calls.map(
      (call: [{ create: { status: OvertimeStatus } }]) => call[0].create.status,
    );
    expect(statuses.slice(0, 4)).toEqual([
      OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
      OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
      OvertimeStatus.APROBADA,
      OvertimeStatus.OBJETADA,
    ]);

    for (const call of upsertRequest.mock.calls) {
      const data = call[0].create;
      expect(data.type).toBe(OvertimeRequestType.SOLICITUD_ADMINISTRATIVA);
      expect(data.batchId).toBe(ADMIN_DEMO_BATCH_ID);
      expect(data.requestedByUserId).toBe('11111111-0000-0000-0000-000000000011');
      expect(data.shiftEndTime).toBeNull();
      expect(data.actualEndTime).toBeNull();
      expect(data.accumulatedMinutes).toBeNull();
      expect(data.workDate).toEqual(workDate);
      expect(data.proposedMinutes).toBe(90);
      expect(data.reasonOptionId).toBeTruthy();
    }
  });
});
