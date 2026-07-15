import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeeContractType, Prisma, SalaryType, type LaborLegalParameter } from '@prisma/client';

import type { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { LegalParameterSnapshot } from '../../labor-legal-parameters/service/legal-parameter-snapshot';
import type { PrismaService } from '../../prisma/prisma.service';
import type { PrimaLiquidationRecord } from '../interfaces/prima.interfaces';
import type { EmployeeHistoryRepository } from '../repository/employee-history.repository';
import type { PayrollRepository } from '../repository/payroll.repository';
import type { PrimaRepository } from '../repository/prima.repository';
import { PrimaCalculationService } from '../service/prima-calculation.service';
import { PrimaService } from '../service/prima.service';

function legalParam(
  key: string,
  value: number,
  overrides: Partial<LaborLegalParameter> = {},
): LaborLegalParameter {
  return {
    id: `param-${key}`,
    tenantId: null,
    tenantScope: 'GLOBAL',
    key,
    value: new Prisma.Decimal(value),
    validFrom: new Date('2020-01-01'),
    validTo: null,
    source: 'test',
    deletedAt: null,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
    ...overrides,
  } as LaborLegalParameter;
}

const DEFAULT_LEGAL_ROWS: LaborLegalParameter[] = [
  legalParam('AUXILIO_TRANSPORTE', 249095),
  legalParam('SMLV', 1750905),
];

function employee(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'emp-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    hireDate: new Date('2020-01-01'),
    contractStart: new Date('2020-01-01'),
    contractEnd: null,
    contractType: EmployeeContractType.INDEFINIDO,
    hasTransportSubsidy: false,
    isActive: true,
    deletedAt: null,
    ...overrides,
  };
}

function salaryEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'salhist-1',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: '1750905',
    effectiveFrom: new Date('2020-01-01'),
    effectiveTo: null,
    changedBy: null,
    createdAt: new Date('2020-01-01'),
    ...overrides,
  };
}

function primaRecord(overrides: Partial<PrimaLiquidationRecord> = {}): PrimaLiquidationRecord {
  return {
    id: 'prima-1',
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    year: 2025,
    half: 'SEGUNDO_SEMESTRE',
    periodStart: new Date('2025-07-01'),
    periodEnd: new Date('2025-12-31'),
    accrualDays: 180,
    calculationBase: '1750905',
    accruedAmount: '1750905',
    paidAmount: '0',
    divisorSnapshot: '180',
    status: 'CALCULADA',
    calculatedBy: null,
    calculatedAt: new Date('2025-12-31'),
    createdAt: new Date('2025-12-31'),
    updatedAt: new Date('2025-12-31'),
    ...overrides,
  };
}

describe('PrimaService', (): void => {
  let service: PrimaService;
  let findByIdPayroll: jest.Mock;
  let findSalaryHistoryByEmployee: jest.Mock;
  let findByEmployeeAndPeriod: jest.Mock;
  let findAllByEmployee: jest.Mock;
  let findByIdPrima: jest.Mock;
  let upsertCalculationTx: jest.Mock;
  let registerPaymentTx: jest.Mock;
  let annulTx: jest.Mock;
  let getValueAt: jest.Mock;
  let preload: jest.Mock;
  let $transaction: jest.Mock;

  beforeEach((): void => {
    findByIdPayroll = jest.fn().mockResolvedValue(employee());
    findSalaryHistoryByEmployee = jest.fn().mockResolvedValue([salaryEntry()]);
    findByEmployeeAndPeriod = jest.fn().mockResolvedValue(null);
    findAllByEmployee = jest.fn().mockResolvedValue([]);
    findByIdPrima = jest.fn().mockResolvedValue(primaRecord());
    upsertCalculationTx = jest.fn().mockImplementation(
      (_tx: unknown, data: Record<string, unknown>): PrimaLiquidationRecord =>
        primaRecord({
          ...data,
          calculationBase: (data.calculationBase as Prisma.Decimal).toString(),
          accruedAmount: (data.accruedAmount as Prisma.Decimal).toString(),
          divisorSnapshot: (data.divisorSnapshot as Prisma.Decimal).toString(),
        } as Partial<PrimaLiquidationRecord>),
    );
    registerPaymentTx = jest.fn();
    annulTx = jest.fn();
    getValueAt = jest.fn().mockResolvedValue(180);
    preload = jest
      .fn()
      .mockResolvedValue(new LegalParameterSnapshot(DEFAULT_LEGAL_ROWS, 'tenant-1'));
    $transaction = jest.fn().mockImplementation((cb: (tx: unknown) => unknown): unknown => cb({}));

    const prismaService = { $transaction } as unknown as PrismaService;
    const payrollRepository = { findById: findByIdPayroll } as unknown as PayrollRepository;
    const employeeHistoryRepository = {
      findSalaryHistoryByEmployee,
    } as unknown as EmployeeHistoryRepository;
    const primaRepository = {
      findByEmployeeAndPeriod,
      findAllByEmployee,
      findById: findByIdPrima,
      upsertCalculationTx,
      registerPaymentTx,
      annulTx,
    } as unknown as PrimaRepository;
    const legalParametersService = {
      getValueAt,
      preload,
    } as unknown as LaborLegalParametersService;

    service = new PrimaService(
      prismaService,
      primaRepository,
      payrollRepository,
      employeeHistoryRepository,
      new PrimaCalculationService(),
      legalParametersService,
    );
  });

  describe('calculateForEmployeeSemester', (): void => {
    it('calcula un semestre completo para un empleado activo todo el periodo', async (): Promise<void> => {
      const result = await service.calculateForEmployeeSemester(
        'tenant-1',
        'emp-1',
        2026,
        'PRIMER_SEMESTRE',
        'user-9',
      );

      expect(upsertCalculationTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ employeeId: 'emp-1', year: 2026, half: 'PRIMER_SEMESTRE' }),
      );
      expect(result.accruedAmount).toBeDefined();
    });

    it('prorratea un empleado con menos de seis meses (ingreso a mitad de semestre)', async (): Promise<void> => {
      findByIdPayroll.mockResolvedValue(employee({ hireDate: new Date('2026-04-01') }));
      findSalaryHistoryByEmployee.mockResolvedValue([
        salaryEntry({ effectiveFrom: new Date('2026-04-01') }),
      ]);

      await service.calculateForEmployeeSemester('tenant-1', 'emp-1', 2026, 'PRIMER_SEMESTRE');

      const [, written] = upsertCalculationTx.mock.calls[0] as [unknown, { accrualDays: number }];
      expect(written.accrualDays).toBe(90); // abril-junio, 3 meses × 30
    });

    it('rechaza recalcular un semestre ya PAGADA (evita doble pago)', async (): Promise<void> => {
      findByEmployeeAndPeriod.mockResolvedValue(primaRecord({ status: 'PAGADA' }));

      await expect(
        service.calculateForEmployeeSemester('tenant-1', 'emp-1', 2026, 'PRIMER_SEMESTRE'),
      ).rejects.toThrow(ConflictException);
      expect(upsertCalculationTx).not.toHaveBeenCalled();
    });

    it('rechaza contratos exentos (PRESTACION) — no causan prima', async (): Promise<void> => {
      findByIdPayroll.mockResolvedValue(
        employee({ contractType: EmployeeContractType.PRESTACION }),
      );

      await expect(
        service.calculateForEmployeeSemester('tenant-1', 'emp-1', 2026, 'PRIMER_SEMESTRE'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si el empleado no existe o es de otro tenant', async (): Promise<void> => {
      findByIdPayroll.mockResolvedValue(null);

      await expect(
        service.calculateForEmployeeSemester('tenant-1', 'emp-x', 2026, 'PRIMER_SEMESTRE'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPrimaBalanceAsOf', (): void => {
    it('reporta saldo pendiente cuando lo causado supera lo pagado (prima parcial)', async (): Promise<void> => {
      findAllByEmployee.mockResolvedValue([
        primaRecord({ accruedAmount: '900000', paidAmount: '450000', status: 'CALCULADA' }),
      ]);

      const result = await service.getPrimaBalanceAsOf('tenant-1', 'emp-1', new Date('2025-12-31'));

      expect(Number(result.pendingAmount)).toBeCloseTo(450000, 0);
      expect(Number(result.overpaymentAmount)).toBe(0);
      expect(result.sourceLiquidations).toHaveLength(1);
    });

    it('reporta sobrepago cuando lo pagado supera lo causado', async (): Promise<void> => {
      findAllByEmployee.mockResolvedValue([
        primaRecord({ accruedAmount: '729544', paidAmount: '800000', status: 'PAGADA' }),
      ]);

      const result = await service.getPrimaBalanceAsOf('tenant-1', 'emp-1', new Date('2025-12-31'));

      expect(Number(result.overpaymentAmount)).toBeCloseTo(70456, 0);
      expect(Number(result.pendingAmount)).toBe(0);
    });

    it('reporta saldo cero (ni pendiente ni sobrepago) cuando ya está pagada exactamente', async (): Promise<void> => {
      findAllByEmployee.mockResolvedValue([
        primaRecord({ accruedAmount: '7500000', paidAmount: '7500000', status: 'PAGADA' }),
      ]);

      const result = await service.getPrimaBalanceAsOf('tenant-1', 'emp-1', new Date('2025-12-31'));

      expect(Number(result.pendingAmount)).toBe(0);
      expect(Number(result.overpaymentAmount)).toBe(0);
    });

    it('excluye liquidaciones ANULADA del saldo (no cuentan como causadas ni pagadas)', async (): Promise<void> => {
      findAllByEmployee.mockResolvedValue([
        primaRecord({ accruedAmount: '900000', paidAmount: '900000', status: 'ANULADA' }),
      ]);
      findByIdPayroll.mockResolvedValue(
        employee({ contractType: EmployeeContractType.PRESTACION }), // sin tramo en vivo, aísla el efecto de ANULADA
      );

      const result = await service.getPrimaBalanceAsOf('tenant-1', 'emp-1', new Date('2025-12-31'));

      expect(result.accruedAmount).toBe('0');
      expect(result.paidAmount).toBe('0');
    });

    it('nunca escribe en la base de datos (previsualización pura)', async (): Promise<void> => {
      await service.getPrimaBalanceAsOf('tenant-1', 'emp-1', new Date('2026-03-15'));

      expect(upsertCalculationTx).not.toHaveBeenCalled();
      expect($transaction).not.toHaveBeenCalled();
    });
  });

  describe('registerPayment', (): void => {
    it('rechaza registrar pago sobre una liquidación ANULADA', async (): Promise<void> => {
      findByIdPrima.mockResolvedValue(primaRecord({ status: 'ANULADA' }));

      await expect(service.registerPayment('tenant-1', 'prima-1', 100000)).rejects.toThrow(
        ConflictException,
      );
      expect(registerPaymentTx).not.toHaveBeenCalled();
    });

    it('rechaza un monto menor o igual a 0', async (): Promise<void> => {
      await expect(service.registerPayment('tenant-1', 'prima-1', 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('un pago parcial (no alcanza accruedAmount) mantiene CALCULADA — no fuerza PAGADA', async (): Promise<void> => {
      findByIdPrima.mockResolvedValue(
        primaRecord({ accruedAmount: '1750905', paidAmount: '0', status: 'CALCULADA' }),
      );

      await service.registerPayment('tenant-1', 'prima-1', 450000);

      const [, id, amount, nextStatus] = registerPaymentTx.mock.calls[0] as [
        unknown,
        string,
        Prisma.Decimal,
        string,
      ];
      expect(id).toBe('prima-1');
      expect(amount.toString()).toBe('450000');
      expect(nextStatus).toBe('CALCULADA');
    });

    it('un pago que alcanza exactamente accruedAmount transiciona a PAGADA', async (): Promise<void> => {
      findByIdPrima.mockResolvedValue(
        primaRecord({ accruedAmount: '900000', paidAmount: '450000', status: 'CALCULADA' }),
      );

      await service.registerPayment('tenant-1', 'prima-1', 450000);

      const [, , , nextStatus] = registerPaymentTx.mock.calls[0] as [
        unknown,
        string,
        Prisma.Decimal,
        string,
      ];
      expect(nextStatus).toBe('PAGADA');
    });

    it('un pago que supera accruedAmount (sobrepago) también transiciona a PAGADA', async (): Promise<void> => {
      findByIdPrima.mockResolvedValue(
        primaRecord({ accruedAmount: '729544', paidAmount: '0', status: 'CALCULADA' }),
      );

      await service.registerPayment('tenant-1', 'prima-1', 800000);

      const [, , , nextStatus] = registerPaymentTx.mock.calls[0] as [
        unknown,
        string,
        Prisma.Decimal,
        string,
      ];
      expect(nextStatus).toBe('PAGADA');
    });
  });

  describe('annul', (): void => {
    it('lanza NotFoundException si la liquidación no existe', async (): Promise<void> => {
      findByIdPrima.mockResolvedValue(null);

      await expect(service.annul('tenant-1', 'prima-x')).rejects.toThrow(NotFoundException);
    });

    it('delega en annulTx cuando la liquidación existe', async (): Promise<void> => {
      await service.annul('tenant-1', 'prima-1');

      expect(annulTx).toHaveBeenCalledWith(expect.anything(), 'prima-1');
    });
  });
});
