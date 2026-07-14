import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as ExcelJS from 'exceljs';

import { AuditService } from '../../audit/service/audit.service';
import type { CesantiasLiquidationRecord } from '../interfaces/cesantias.interfaces';
import { CesantiasRepository } from '../repository/cesantias.repository';
import { PayrollRepository } from '../repository/payroll.repository';
import { CesantiasExportService } from '../service/cesantias-export.service';

interface MockCesantiasRepository {
  findExportableByTenantAndYear: jest.Mock;
}

interface MockPayrollRepository {
  findManyWithPersonalDataByIds: jest.Mock;
}

interface MockAuditService {
  log: jest.Mock;
}

function liquidation(
  overrides: Partial<CesantiasLiquidationRecord> = {},
): CesantiasLiquidationRecord {
  return {
    id: 'liq-1',
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    year: 2026,
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-12-31'),
    accrualDays: 360,
    calculationBase: '1500000.00',
    cesantiasAmount: '1500000.00',
    interestAmount: '180000.00',
    interestRateSnapshot: '0.12',
    fundNameSnapshot: 'Fondo Nacional del Ahorro',
    fundChannelSnapshot: 'FNA',
    cesantiasStatus: 'CALCULADA',
    interestStatus: 'CALCULADO',
    calculatedBy: 'user-1',
    calculatedAt: new Date('2026-01-15'),
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    ...overrides,
  };
}

function employee(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'emp-1',
    tenantId: 'tenant-1',
    user: { documentType: 'CC', cedula: '10000001' },
    personalData: {
      nombres: 'Ana',
      primerApellido: 'Gómez',
      segundoApellido: 'Ruiz',
    },
    ...overrides,
  };
}

async function readWorkbook(buffer: Buffer): Promise<ExcelJS.Worksheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('workbook has no worksheet');
  }
  return sheet;
}

describe('CesantiasExportService', (): void => {
  let service: CesantiasExportService;
  let mockCesantiasRepository: MockCesantiasRepository;
  let mockPayrollRepository: MockPayrollRepository;
  let mockAuditService: MockAuditService;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CesantiasExportService,
        {
          provide: CesantiasRepository,
          useValue: { findExportableByTenantAndYear: jest.fn() },
        },
        {
          provide: PayrollRepository,
          useValue: { findManyWithPersonalDataByIds: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CesantiasExportService>(CesantiasExportService);
    mockCesantiasRepository = module.get<CesantiasRepository>(
      CesantiasRepository,
    ) as unknown as MockCesantiasRepository;
    mockPayrollRepository = module.get<PayrollRepository>(
      PayrollRepository,
    ) as unknown as MockPayrollRepository;
    mockAuditService = module.get<AuditService>(AuditService) as unknown as MockAuditService;
  });

  describe('clasificación FNA vs privados', (): void => {
    it('generateFnaFile solo incluye liquidaciones con fundChannelSnapshot FNA', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({ employeeId: 'emp-1', fundChannelSnapshot: 'FNA' }),
        liquidation({ employeeId: 'emp-2', fundChannelSnapshot: 'PRIVATE_OPERATOR' }),
      ]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([
        employee({ id: 'emp-1' }),
      ]);

      const result = await service.generateFnaFile('tenant-1', 2026);

      expect(result.rowCount).toBe(1);
      expect(mockPayrollRepository.findManyWithPersonalDataByIds).toHaveBeenCalledWith('tenant-1', [
        'emp-1',
      ]);
    });

    it('generatePrivateFundsFile solo incluye liquidaciones con fundChannelSnapshot PRIVATE_OPERATOR', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({ employeeId: 'emp-1', fundChannelSnapshot: 'FNA' }),
        liquidation({ employeeId: 'emp-2', fundChannelSnapshot: 'PRIVATE_OPERATOR' }),
      ]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([
        employee({ id: 'emp-2' }),
      ]);

      const result = await service.generatePrivateFundsFile('tenant-1', 2026);

      expect(result.rowCount).toBe(1);
      expect(mockPayrollRepository.findManyWithPersonalDataByIds).toHaveBeenCalledWith('tenant-1', [
        'emp-2',
      ]);
    });

    it('excluye liquidaciones ANULADA — el repositorio ya filtra, el servicio no las revalida', async (): Promise<void> => {
      // findExportableByTenantAndYear (mockeado aquí) es responsable de ese filtro — este
      // test documenta el contrato: el servicio confía en lo que el repositorio devuelve.
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([]);

      const result = await service.generateFnaFile('tenant-1', 2026);

      expect(result.rowCount).toBe(0);
    });
  });

  describe('cambio de fondo — usa el snapshot, no el fondo actual', (): void => {
    it('clasifica por fundChannelSnapshot aunque el empleado ya no tenga ese fondo', async (): Promise<void> => {
      // La liquidación quedó fijada en FNA al momento del cálculo; el empleado luego se
      // cambió a un fondo privado (irrelevante para esta exportación — el snapshot manda).
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({
          employeeId: 'emp-1',
          fundChannelSnapshot: 'FNA',
          fundNameSnapshot: 'Fondo Nacional del Ahorro',
        }),
      ]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([
        employee({ id: 'emp-1', cesantiasFundName: 'Porvenir' }),
      ]);

      const fna = await service.generateFnaFile('tenant-1', 2026);
      expect(fna.rowCount).toBe(1);

      const sheet = await readWorkbook(fna.buffer);
      expect(sheet.getRow(2).getCell(8).text).toBe('Fondo Nacional del Ahorro');
    });
  });

  describe('tenant isolation', (): void => {
    it('propaga el tenantId del caller a ambas queries', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([]);

      await service.generateFnaFile('tenant-a', 2026);

      expect(mockCesantiasRepository.findExportableByTenantAndYear).toHaveBeenCalledWith(
        'tenant-a',
        2026,
      );
    });

    it('nunca mezcla empleados de otro tenant: solo arma filas para ids devueltos por findManyWithPersonalDataByIds', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({ employeeId: 'emp-1', fundChannelSnapshot: 'FNA' }),
      ]);
      // Simula que el repositorio (correctamente scoped por tenantId) no devuelve nada —
      // como pasaría si emp-1 perteneciera a otro tenant.
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([]);

      const result = await service.generateFnaFile('tenant-1', 2026);

      expect(result.rowCount).toBe(0);
      expect(result.skipped).toEqual([{ employeeId: 'emp-1', reason: 'SIN_DATOS_PERSONALES' }]);
    });
  });

  describe('datos inválidos — nunca omisión silenciosa (exporta válidos + reporta excluidos)', (): void => {
    it('omite (no incluye con campos vacíos) empleados sin EmployeePersonalData, y lo reporta en `skipped`', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({ employeeId: 'emp-1', fundChannelSnapshot: 'FNA' }),
      ]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([
        employee({ id: 'emp-1', personalData: null }),
      ]);

      const result = await service.generateFnaFile('tenant-1', 2026);

      expect(result.rowCount).toBe(0);
      expect(result.skipped).toEqual([{ employeeId: 'emp-1', reason: 'SIN_DATOS_PERSONALES' }]);
    });

    it('exporta los empleados válidos aunque otros en el mismo lote sean inválidos — no falla toda la exportación', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({ employeeId: 'emp-valido', fundChannelSnapshot: 'FNA' }),
        liquidation({ employeeId: 'emp-invalido', fundChannelSnapshot: 'FNA' }),
      ]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([
        employee({ id: 'emp-valido' }),
        employee({ id: 'emp-invalido', personalData: null }),
      ]);

      const result = await service.generateFnaFile('tenant-1', 2026);

      expect(result.rowCount).toBe(1);
      expect(result.skipped).toEqual([
        { employeeId: 'emp-invalido', reason: 'SIN_DATOS_PERSONALES' },
      ]);
    });

    it('rechaza un año fuera de rango con BadRequestException', async (): Promise<void> => {
      await expect(service.generateFnaFile('tenant-1', 1990)).rejects.toThrow(BadRequestException);
      expect(mockCesantiasRepository.findExportableByTenantAndYear).not.toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('sigue generando un archivo válido (solo encabezado) si todas las liquidaciones se omiten', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({ employeeId: 'emp-1', fundChannelSnapshot: 'FNA' }),
      ]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([
        employee({ id: 'emp-1', personalData: null }),
      ]);

      const result = await service.generateFnaFile('tenant-1', 2026);

      expect(result.buffer).toBeInstanceOf(Buffer);
      const sheet = await readWorkbook(result.buffer);
      expect(sheet.rowCount).toBe(1);
    });
  });

  describe('trazabilidad — auditoría de lo excluido (nunca silencioso)', (): void => {
    it('registra un AuditAction.EXPORT con el detalle completo de lo omitido', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({ employeeId: 'emp-valido', fundChannelSnapshot: 'FNA' }),
        liquidation({ employeeId: 'emp-invalido', fundChannelSnapshot: 'FNA' }),
      ]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([
        employee({ id: 'emp-valido' }),
        employee({ id: 'emp-invalido', personalData: null }),
      ]);

      await service.generateFnaFile('tenant-1', 2026, 'actor-1');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          action: 'EXPORT',
          entityType: 'CesantiasLiquidation',
          entityId: 'tenant-1',
          actorUserId: 'actor-1',
          payload: expect.objectContaining({
            channel: 'FNA',
            year: 2026,
            rowCount: 1,
            skipped: [{ employeeId: 'emp-invalido', reason: 'SIN_DATOS_PERSONALES' }],
          }),
        }),
      );
    });

    it('registra actorUserId null cuando no se pasa un actor', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([]);

      await service.generateFnaFile('tenant-1', 2026);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ actorUserId: null }),
      );
    });

    it('registra la auditoría incluso cuando no hubo ninguna omisión (skipped vacío)', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({ employeeId: 'emp-1', fundChannelSnapshot: 'FNA' }),
      ]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([
        employee({ id: 'emp-1' }),
      ]);

      await service.generateFnaFile('tenant-1', 2026);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ skipped: [] }) }),
      );
    });
  });

  describe('encabezados y contenido del archivo', (): void => {
    it('produce la fila de encabezado esperada', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([]);

      const result = await service.generateFnaFile('tenant-1', 2026);
      const sheet = await readWorkbook(result.buffer);

      const headerValues = sheet.getRow(1).values as unknown[];
      expect(headerValues.slice(1)).toEqual([
        'No.',
        'Tipo ID',
        'Número ID',
        'Primer Apellido',
        'Segundo Apellido',
        'Primer Nombre',
        'Segundo Nombre',
        'Administradora',
        'Salario Mensual($)',
        'Valor a Consignar',
      ]);
    });

    it('produce filas de datos con no. secuencial y sin monto de intereses', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([
        liquidation({
          employeeId: 'emp-1',
          calculationBase: '1500000.00',
          cesantiasAmount: '1500000.00',
          interestAmount: '999999.99',
        }),
        liquidation({
          employeeId: 'emp-2',
          calculationBase: '2000000.00',
          cesantiasAmount: '2000000.00',
          interestAmount: '999999.99',
        }),
      ]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([
        employee({ id: 'emp-1' }),
        employee({ id: 'emp-2', user: { documentType: 'CC', cedula: '10000002' } }),
      ]);

      const result = await service.generateFnaFile('tenant-1', 2026);
      const sheet = await readWorkbook(result.buffer);

      const row1 = sheet.getRow(2).values as unknown[];
      const row2 = sheet.getRow(3).values as unknown[];
      expect(row1[1]).toBe(1);
      expect(row2[1]).toBe(2);

      const rowText = sheet.getRow(2).values as unknown[];
      expect(String(rowText.join(' '))).not.toContain('999999.99');
      expect(sheet.getRow(2).getCell(10).text).toBe('1500000.00');
    });

    it('el nombre de archivo incluye el año y el prefijo del canal', async (): Promise<void> => {
      mockCesantiasRepository.findExportableByTenantAndYear.mockResolvedValue([]);
      mockPayrollRepository.findManyWithPersonalDataByIds.mockResolvedValue([]);

      const fna = await service.generateFnaFile('tenant-1', 2026);
      const priv = await service.generatePrivateFundsFile('tenant-1', 2026);

      expect(fna.filename).toBe('cesantias-fna-2026.xlsx');
      expect(priv.filename).toBe('cesantias-fondos-privados-2026.xlsx');
    });
  });
});
