import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PayrollConcept } from '@prisma/client';

import { GLOBAL_TENANT_SCOPE } from '../payroll-concepts.constants';
import { PayrollConceptsRepository } from '../repository/payroll-concepts.repository';
import { PayrollConceptsService } from '../service/payroll-concepts.service';

function buildConcept(
  overrides: Partial<PayrollConcept> & Pick<PayrollConcept, 'code' | 'tenantScope'>,
): PayrollConcept {
  return {
    id: overrides.id ?? `id-${overrides.code}-${overrides.tenantScope}`,
    tenantId: overrides.tenantId ?? null,
    tenantScope: overrides.tenantScope,
    code: overrides.code,
    displayName: overrides.displayName ?? overrides.code,
    lineNature: overrides.lineNature ?? 'DEVENGO',
    deletedAt: overrides.deletedAt ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('PayrollConceptsService (OS-612 PR1)', (): void => {
  let service: PayrollConceptsService;
  let repository: jest.Mocked<
    Pick<
      PayrollConceptsRepository,
      'findActiveByScopeAndCode' | 'findByScopeAndCodeIncludingDeleted'
    >
  >;

  beforeEach(async (): Promise<void> => {
    repository = {
      findActiveByScopeAndCode: jest.fn(),
      findByScopeAndCodeIncludingDeleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollConceptsService,
        { provide: PayrollConceptsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(PayrollConceptsService);
  });

  describe('findGlobalByCode', (): void => {
    it('resuelve GLOBAL activo', async (): Promise<void> => {
      const global = buildConcept({
        code: 'SALARIO_BASE',
        tenantScope: GLOBAL_TENANT_SCOPE,
        displayName: 'Salario base',
      });
      repository.findActiveByScopeAndCode.mockResolvedValue(global);

      await expect(service.findGlobalByCode('SALARIO_BASE')).resolves.toEqual(global);
      expect(repository.findActiveByScopeAndCode).toHaveBeenCalledWith(
        GLOBAL_TENANT_SCOPE,
        'SALARIO_BASE',
      );
    });

    it('code desconocido produce NotFoundException', async (): Promise<void> => {
      await expect(service.findGlobalByCode('NO_EXISTE')).rejects.toThrow(NotFoundException);
      expect(repository.findActiveByScopeAndCode).not.toHaveBeenCalled();
    });

    it('concepto GLOBAL inactivo no se resuelve como activo', async (): Promise<void> => {
      repository.findActiveByScopeAndCode.mockResolvedValue(null);
      repository.findByScopeAndCodeIncludingDeleted.mockResolvedValue(
        buildConcept({
          code: 'PRIMA',
          tenantScope: GLOBAL_TENANT_SCOPE,
          deletedAt: new Date('2026-06-01T00:00:00.000Z'),
        }),
      );

      await expect(service.findGlobalByCode('PRIMA')).rejects.toThrow(
        /inactivo \(GLOBAL soft-deleted\)/,
      );
    });
  });

  describe('classifyLineSnapshot', (): void => {
    const globalActive = (): PayrollConcept =>
      buildConcept({
        code: 'SALARIO_BASE',
        tenantScope: GLOBAL_TENANT_SCOPE,
        displayName: 'Salario base',
      });

    it('CATALOGED cuando code GLOBAL activo y name = displayName', async (): Promise<void> => {
      repository.findByScopeAndCodeIncludingDeleted.mockResolvedValue(globalActive());
      repository.findActiveByScopeAndCode.mockResolvedValue(null);

      const result = await service.classifyLineSnapshot('tenant-a', 'SALARIO_BASE', 'Salario base');
      expect(result.status).toBe('CATALOGED');
    });

    it('NAME_MISMATCH cuando el snapshot name difiere del efectivo', async (): Promise<void> => {
      repository.findByScopeAndCodeIncludingDeleted.mockResolvedValue(globalActive());
      repository.findActiveByScopeAndCode.mockResolvedValue(null);

      const result = await service.classifyLineSnapshot(
        'tenant-a',
        'SALARIO_BASE',
        'Sal. Base viejo',
      );
      expect(result.status).toBe('NAME_MISMATCH');
      expect(result.catalogDisplayName).toBe('Salario base');
    });

    it('UNCATALOGED cuando no hay fila GLOBAL', async (): Promise<void> => {
      repository.findByScopeAndCodeIncludingDeleted.mockResolvedValue(null);
      const result = await service.classifyLineSnapshot('tenant-a', 'FOO', 'Foo');
      expect(result.status).toBe('UNCATALOGED');
    });

    it('INACTIVE cuando GLOBAL está soft-deleted', async (): Promise<void> => {
      repository.findByScopeAndCodeIncludingDeleted.mockResolvedValue({
        ...globalActive(),
        deletedAt: new Date(),
      });
      const result = await service.classifyLineSnapshot('tenant-a', 'SALARIO_BASE', 'Salario base');
      expect(result.status).toBe('INACTIVE');
    });
  });

  describe('resolveEffective', (): void => {
    const global = buildConcept({
      id: 'global-sal',
      code: 'SALARIO_BASE',
      tenantScope: GLOBAL_TENANT_SCOPE,
      displayName: 'Salario base',
      lineNature: 'DEVENGO',
    });

    it('sin tenant usa displayName GLOBAL', async (): Promise<void> => {
      repository.findActiveByScopeAndCode.mockResolvedValue(global);

      const effective = await service.resolveEffective(null, 'SALARIO_BASE');
      expect(effective).toEqual({
        id: 'global-sal',
        code: 'SALARIO_BASE',
        displayName: 'Salario base',
        lineNature: 'DEVENGO',
        isTenantOverride: false,
        overrideId: null,
      });
    });

    it('override tenant tiene precedencia solo en displayName', async (): Promise<void> => {
      const override = buildConcept({
        id: 'ovr-1',
        tenantId: 'tenant-a',
        tenantScope: 'tenant-a',
        code: 'SALARIO_BASE',
        displayName: 'Sueldo básico (tenant)',
        lineNature: 'DEVENGO',
      });
      repository.findActiveByScopeAndCode.mockImplementation(
        async (scope: string): Promise<PayrollConcept | null> => {
          if (scope === GLOBAL_TENANT_SCOPE) return global;
          if (scope === 'tenant-a') return override;
          return null;
        },
      );

      const effective = await service.resolveEffective('tenant-a', 'SALARIO_BASE');
      expect(effective.displayName).toBe('Sueldo básico (tenant)');
      expect(effective.lineNature).toBe('DEVENGO');
      expect(effective.id).toBe('global-sal');
      expect(effective.isTenantOverride).toBe(true);
      expect(effective.overrideId).toBe('ovr-1');
    });

    it('override con lineNature distinto al GLOBAL es rechazado', async (): Promise<void> => {
      const badOverride = buildConcept({
        id: 'ovr-bad',
        tenantId: 'tenant-a',
        tenantScope: 'tenant-a',
        code: 'SALARIO_BASE',
        displayName: 'X',
        lineNature: 'DEDUCCION',
      });
      repository.findActiveByScopeAndCode.mockImplementation(
        async (scope: string): Promise<PayrollConcept | null> => {
          if (scope === GLOBAL_TENANT_SCOPE) return global;
          return badOverride;
        },
      );

      await expect(service.resolveEffective('tenant-a', 'SALARIO_BASE')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('override inactivo cae al GLOBAL', async (): Promise<void> => {
      repository.findActiveByScopeAndCode.mockImplementation(
        async (scope: string): Promise<PayrollConcept | null> => {
          if (scope === GLOBAL_TENANT_SCOPE) return global;
          return null; // deletedAt filtrado en repo → null
        },
      );

      const effective = await service.resolveEffective('tenant-a', 'SALARIO_BASE');
      expect(effective.isTenantOverride).toBe(false);
      expect(effective.displayName).toBe('Salario base');
    });

    it('GLOBAL inactivo no se resuelve aunque exista override', async (): Promise<void> => {
      repository.findActiveByScopeAndCode.mockResolvedValue(null);
      repository.findByScopeAndCodeIncludingDeleted.mockResolvedValue(
        buildConcept({
          code: 'SALARIO_BASE',
          tenantScope: GLOBAL_TENANT_SCOPE,
          deletedAt: new Date(),
        }),
      );

      await expect(service.resolveEffective('tenant-a', 'SALARIO_BASE')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findTenantOverrideByCode', (): void => {
    it('requiere tenantId', async (): Promise<void> => {
      await expect(service.findTenantOverrideByCode('  ', 'PRIMA')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
