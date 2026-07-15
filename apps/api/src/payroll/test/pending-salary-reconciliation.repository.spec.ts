import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PendingSalaryReconciliationRepository } from '../repository/pending-salary-reconciliation.repository';

const TENANT_ID = 'tenant-test-001';
const SETTLEMENT_ID = 'settlement-001';

describe('PendingSalaryReconciliationRepository', (): void => {
  let repository: PendingSalaryReconciliationRepository;
  let mockFindFirst: jest.Mock;
  let mockCreate: jest.Mock;

  function baseRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
    return {
      id: 'reconciliation-001',
      tenantId: TENANT_ID,
      settlementId: SETTLEMENT_ID,
      previouslyPaidAmount: new Prisma.Decimal('0'),
      paymentReference: null,
      paymentDate: null,
      responsible: 'Juan Pérez',
      observation: 'Verificado contra nómina previa',
      recognizedBalance: new Prisma.Decimal('100000'),
      createdBy: 'user-001',
      createdAt: new Date('2026-01-01'),
      ...overrides,
    };
  }

  beforeEach(async (): Promise<void> => {
    mockFindFirst = jest.fn();
    mockCreate = jest.fn();

    const prisma = {
      pendingSalaryReconciliation: { findFirst: mockFindFirst, create: mockCreate },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PendingSalaryReconciliationRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<PendingSalaryReconciliationRepository>(
      PendingSalaryReconciliationRepository,
    );
  });

  describe('findBySettlement', (): void => {
    it('consulta por tenantId + settlementId', async (): Promise<void> => {
      mockFindFirst.mockResolvedValue(baseRow());

      const result = await repository.findBySettlement(TENANT_ID, SETTLEMENT_ID);

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID, settlementId: SETTLEMENT_ID },
      });
      expect(result?.settlementId).toBe(SETTLEMENT_ID);
    });

    it('devuelve null si no existe reconciliación', async (): Promise<void> => {
      mockFindFirst.mockResolvedValue(null);

      const result = await repository.findBySettlement(TENANT_ID, SETTLEMENT_ID);

      expect(result).toBeNull();
    });
  });

  describe('create', (): void => {
    it('persiste montos como Prisma.Decimal y devuelve strings formateados', async (): Promise<void> => {
      mockCreate.mockResolvedValue(baseRow());

      const result = await repository.create({
        tenantId: TENANT_ID,
        settlementId: SETTLEMENT_ID,
        previouslyPaidAmount: '0.00',
        responsible: 'Juan Pérez',
        observation: 'Verificado contra nómina previa',
        recognizedBalance: '100000.00',
        createdBy: 'user-001',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT_ID,
          settlementId: SETTLEMENT_ID,
          responsible: 'Juan Pérez',
        }),
      });
      expect(result.recognizedBalance).toBe('100000.00');
      expect(result.previouslyPaidAmount).toBe('0.00');
    });
  });
});
