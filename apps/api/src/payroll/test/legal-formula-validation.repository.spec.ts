import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { LegalFormulaValidationRepository } from '../repository/legal-formula-validation.repository';

const TENANT_ID = 'tenant-test-001';

describe('LegalFormulaValidationRepository', (): void => {
  let repository: LegalFormulaValidationRepository;
  let mockFindFirst: jest.Mock;
  let mockFindMany: jest.Mock;
  let mockUpdateMany: jest.Mock;
  let mockCreate: jest.Mock;
  let mockTransaction: jest.Mock;

  function baseRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
    return {
      id: 'validation-001',
      tenantId: TENANT_ID,
      formulaVersion: 1,
      isActive: true,
      legalReference: 'Concepto Jurídico 001-2026',
      observations: null,
      validatedBy: 'legal-001',
      validatedAt: new Date('2026-01-01'),
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    };
  }

  beforeEach(async (): Promise<void> => {
    mockFindFirst = jest.fn();
    mockFindMany = jest.fn();
    mockUpdateMany = jest.fn().mockResolvedValue({ count: 0 });
    mockCreate = jest.fn();

    // $transaction ejecuta el callback con un "tx" que reutiliza los mismos mocks —
    // mismo patrón de duck-typing que el resto de repositorios del dominio.
    mockTransaction = jest.fn(
      async (cb: (tx: unknown) => Promise<unknown>): Promise<unknown> =>
        cb({
          indemnificationFormulaValidation: {
            updateMany: mockUpdateMany,
            create: mockCreate,
          },
        }),
    );

    const prisma = {
      indemnificationFormulaValidation: {
        findFirst: mockFindFirst,
        findMany: mockFindMany,
      },
      $transaction: mockTransaction,
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [LegalFormulaValidationRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<LegalFormulaValidationRepository>(LegalFormulaValidationRepository);
  });

  describe('findActive', (): void => {
    it('consulta por tenantId + formulaVersion + isActive=true', async (): Promise<void> => {
      mockFindFirst.mockResolvedValue(baseRow());

      const result = await repository.findActive(TENANT_ID, 1);

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID, formulaVersion: 1, isActive: true },
      });
      expect(result?.formulaVersion).toBe(1);
    });

    it('devuelve null si no hay validación activa para esa versión', async (): Promise<void> => {
      mockFindFirst.mockResolvedValue(null);

      const result = await repository.findActive(TENANT_ID, 99);

      expect(result).toBeNull();
    });
  });

  describe('findAllByTenant', (): void => {
    it('lista el historial completo ordenado por fecha de creación descendente', async (): Promise<void> => {
      mockFindMany.mockResolvedValue([
        baseRow(),
        baseRow({ id: 'validation-002', isActive: false }),
      ]);

      const result = await repository.findAllByTenant(TENANT_ID);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('create', (): void => {
    it('desactiva la validación activa previa de la misma versión antes de crear la nueva', async (): Promise<void> => {
      mockCreate.mockResolvedValue(baseRow({ id: 'validation-002' }));

      await repository.create({
        tenantId: TENANT_ID,
        formulaVersion: 1,
        legalReference: 'Concepto Jurídico 002-2026',
        validatedBy: 'legal-002',
        validatedAt: new Date('2026-02-01'),
      });

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID, formulaVersion: 1, isActive: true },
        data: { isActive: false },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT_ID,
          formulaVersion: 1,
          legalReference: 'Concepto Jurídico 002-2026',
          isActive: true,
        }),
      });
    });

    it('no falla si no existía ninguna validación previa (updateMany count=0)', async (): Promise<void> => {
      mockCreate.mockResolvedValue(baseRow());

      const result = await repository.create({
        tenantId: TENANT_ID,
        formulaVersion: 1,
        legalReference: 'Concepto Jurídico 001-2026',
        validatedBy: 'legal-001',
        validatedAt: new Date('2026-01-01'),
      });

      expect(result.formulaVersion).toBe(1);
      expect(result.isActive).toBe(true);
    });
  });
});
