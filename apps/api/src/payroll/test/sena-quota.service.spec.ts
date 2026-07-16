import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EmployeeContractType } from '@prisma/client';

import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import type { EmploymentContractRecord } from '../interfaces/employee-contract.interfaces';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';
import { SenaQuotaService } from '../service/sena-quota.service';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const PERIOD_2026_06 = '2026-06';
const SMLV_2026 = 1_750_905;
const FACTOR_POST_REFORM = 1.5;
const SMLV_2025 = 1_423_500;

function contract(
  employeeDetailsId: string,
  contractType: EmployeeContractType,
  tenantId = TENANT_A,
): EmploymentContractRecord {
  return {
    id: `c-${employeeDetailsId}`,
    tenantId,
    employeeDetailsId,
    contractType,
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    agreedEndDate: null,
    status: 'ACTIVO',
    terminationDate: null,
    terminationReason: null,
    terminationNotes: null,
    activeSlot: true,
    changedBy: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };
}

function nContracts(
  count: number,
  type: EmployeeContractType,
  prefix: string,
  tenantId = TENANT_A,
): EmploymentContractRecord[] {
  return Array.from({ length: count }, (_, i): EmploymentContractRecord => {
    return contract(`${prefix}-${i}`, type, tenantId);
  });
}

describe('SenaQuotaService (OS-599 hardening)', (): void => {
  let service: SenaQuotaService;
  let findContractsAsOfForTenant: jest.Mock;
  let getValueAt: jest.Mock;

  beforeEach(async (): Promise<void> => {
    findContractsAsOfForTenant = jest.fn();
    getValueAt = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SenaQuotaService,
        {
          provide: EmployeeContractRepository,
          useValue: { findContractsAsOfForTenant },
        },
        {
          provide: LaborLegalParametersService,
          useValue: { getValueAt },
        },
      ],
    }).compile();

    service = module.get(SenaQuotaService);

    getValueAt.mockImplementation((key: string): Promise<number> => {
      if (key === 'SMLV') {
        return Promise.resolve(SMLV_2026);
      }
      if (key === 'SENA_CUOTA_MONETIZACION_FACTOR') {
        return Promise.resolve(FACTOR_POST_REFORM);
      }
      return Promise.reject(new Error(`unexpected key ${key}`));
    });
  });

  it('FIJO computable en eligibleWorkers', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue(nContracts(15, EmployeeContractType.FIJO, 'f'));
    const result = await service.calculateForTenant(TENANT_A, PERIOD_2026_06);
    expect(result.eligibleWorkers).toBe(15);
  });

  it('INDEFINIDO computable en eligibleWorkers', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue(
      nContracts(15, EmployeeContractType.INDEFINIDO, 'i'),
    );
    const result = await service.calculateForTenant(TENANT_A, PERIOD_2026_06);
    expect(result.eligibleWorkers).toBe(15);
  });

  it('OBRA computable en eligibleWorkers', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue(nContracts(15, EmployeeContractType.OBRA, 'o'));
    const result = await service.calculateForTenant(TENANT_A, PERIOD_2026_06);
    expect(result.eligibleWorkers).toBe(15);
  });

  it('APRENDIZAJE no incrementa eligibleWorkers; solo activeApprentices', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue([
      ...nContracts(15, EmployeeContractType.FIJO, 'w'),
      ...nContracts(3, EmployeeContractType.APRENDIZAJE, 'a'),
    ]);

    const result = await service.calculateForTenant(TENANT_A, PERIOD_2026_06);

    expect(result.eligibleWorkers).toBe(15);
    expect(result.activeApprentices).toBe(3);
  });

  it('PRESTACION (prestación de servicios) no incrementa eligibleWorkers', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue([
      ...nContracts(15, EmployeeContractType.FIJO, 'w'),
      ...nContracts(8, EmployeeContractType.PRESTACION, 'p'),
    ]);

    const result = await service.calculateForTenant(TENANT_A, PERIOD_2026_06);

    expect(result.eligibleWorkers).toBe(15);
    expect(result.activeApprentices).toBe(0);
  });

  it('menos de 15 → EXEMPT', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue(nContracts(14, EmployeeContractType.FIJO, 'w'));

    const result = await service.calculateForTenant(TENANT_A, PERIOD_2026_06);

    expect(result.status).toBe('EXEMPT');
    expect(result.estimatedMonetizationAmount).toBe(0);
    expect(result.estimated).toBe(true);
  });

  it('post-reforma (2026-06): régimen LEY_2466_2025; monto missing × SMLV × 1.5; sin monetizationFactor', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue(nContracts(15, EmployeeContractType.FIJO, 'w'));

    const result = await service.calculateForTenant(TENANT_A, PERIOD_2026_06);

    expect(result.monetizationRegime).toBe('LEY_2466_2025');
    expect(result.estimatedMonetizationAmount).toBe(Math.round(SMLV_2026 * FACTOR_POST_REFORM));
    expect(result).not.toHaveProperty('monetizationFactor');
    expect(getValueAt).toHaveBeenCalledWith(
      'SENA_CUOTA_MONETIZACION_FACTOR',
      expect.any(Date),
      TENANT_A,
    );
  });

  it('pre-reforma (2025-03): régimen LEY_789_2002; art. 34; no consulta factor NOM-06', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue(nContracts(15, EmployeeContractType.FIJO, 'w'));
    getValueAt.mockImplementation((key: string, date: Date): Promise<number> => {
      expect(date.toISOString()).toBe('2025-03-31T23:59:59.999Z');
      if (key === 'SMLV') {
        return Promise.resolve(SMLV_2025);
      }
      return Promise.reject(new Error(`unexpected key ${key}`));
    });

    const result = await service.calculateForTenant(TENANT_A, '2025-03');

    expect(result.smlv).toBe(SMLV_2025);
    expect(result.monetizationRegime).toBe('LEY_789_2002');
    expect(result.estimatedMonetizationAmount).toBe(Math.round(0.05 * 15 * SMLV_2025));
    expect(result).not.toHaveProperty('monetizationFactor');
    expect(getValueAt).toHaveBeenCalledWith('SMLV', expect.any(Date), TENANT_A);
    expect(getValueAt).not.toHaveBeenCalledWith(
      'SENA_CUOTA_MONETIZACION_FACTOR',
      expect.anything(),
      expect.anything(),
    );
  });

  it('frontera: cierre 2025-06-24 → LEY_789_2002; cierre 2025-06-25 → LEY_2466_2025', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue(nContracts(15, EmployeeContractType.FIJO, 'w'));

    // Período artificial: asOfDate se fuerza vía mock de getValueAt + lastDayOfMonth.
    // Validamos régimen con períodos cuyo cierre cae exactamente en la frontera legal.
    getValueAt.mockImplementation((key: string): Promise<number> => {
      if (key === 'SMLV') {
        return Promise.resolve(SMLV_2025);
      }
      if (key === 'SENA_CUOTA_MONETIZACION_FACTOR') {
        return Promise.resolve(FACTOR_POST_REFORM);
      }
      return Promise.reject(new Error(`unexpected key ${key}`));
    });

    // 2025-05 cierra 2025-05-31 (< 2025-06-25)
    const may = await service.calculateForTenant(TENANT_A, '2025-05');
    expect(may.monetizationRegime).toBe('LEY_789_2002');
    expect(may.estimatedMonetizationAmount).toBe(Math.round(0.05 * 15 * SMLV_2025));
    expect(may).not.toHaveProperty('monetizationFactor');

    getValueAt.mockClear();
    getValueAt.mockImplementation((key: string, date: Date): Promise<number> => {
      if (key === 'SMLV') {
        return Promise.resolve(SMLV_2025);
      }
      if (key === 'SENA_CUOTA_MONETIZACION_FACTOR') {
        expect(date.toISOString()).toBe('2025-06-30T23:59:59.999Z');
        return Promise.resolve(FACTOR_POST_REFORM);
      }
      return Promise.reject(new Error(`unexpected key ${key}`));
    });

    // 2025-06 cierra 2025-06-30 (≥ 2025-06-25)
    const june = await service.calculateForTenant(TENANT_A, '2025-06');
    expect(june.monetizationRegime).toBe('LEY_2466_2025');
    expect(june.estimatedMonetizationAmount).toBe(Math.round(SMLV_2025 * FACTOR_POST_REFORM));
    expect(june).not.toHaveProperty('monetizationFactor');
  });

  it('cuota completa en ambas vigencias → monetización 0', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue([
      ...nContracts(20, EmployeeContractType.INDEFINIDO, 'w'),
      contract('apr-1', EmployeeContractType.APRENDIZAJE),
    ]);

    const post = await service.calculateForTenant(TENANT_A, PERIOD_2026_06);
    expect(post.status).toBe('COMPLIANT');
    expect(post.monetizationRegime).toBe('LEY_2466_2025');
    expect(post.estimatedMonetizationAmount).toBe(0);
    expect(post).not.toHaveProperty('monetizationFactor');

    getValueAt.mockImplementation((key: string): Promise<number> => {
      if (key === 'SMLV') {
        return Promise.resolve(SMLV_2025);
      }
      return Promise.reject(new Error(`unexpected key ${key}`));
    });

    const pre = await service.calculateForTenant(TENANT_A, '2025-03');
    expect(pre.status).toBe('COMPLIANT');
    expect(pre.monetizationRegime).toBe('LEY_789_2002');
    expect(pre.estimatedMonetizationAmount).toBe(0);
    expect(pre).not.toHaveProperty('monetizationFactor');
  });

  it('multi-tenant + una sola query bulk', async (): Promise<void> => {
    findContractsAsOfForTenant.mockResolvedValue(
      nContracts(10, EmployeeContractType.FIJO, 'b', TENANT_B),
    );

    await service.calculateForTenant(TENANT_B, PERIOD_2026_06);

    expect(findContractsAsOfForTenant).toHaveBeenCalledTimes(1);
    expect(findContractsAsOfForTenant).toHaveBeenCalledWith(TENANT_B, expect.any(Date));
    expect(getValueAt).toHaveBeenCalledWith('SMLV', expect.any(Date), TENANT_B);
  });

  it('rechaza período inválido', async (): Promise<void> => {
    await expect(service.calculateForTenant(TENANT_A, '2026/06')).rejects.toThrow(
      BadRequestException,
    );
    expect(findContractsAsOfForTenant).not.toHaveBeenCalled();
  });
});
