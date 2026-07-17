import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  type ContractTerminationReason,
  AuditAction,
  EmployeeContractType,
  FinalSettlementMode,
  FinalSettlementStatus,
  SalaryType,
} from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import type { FinalSettlementRecord } from '../interfaces/final-settlement.interfaces';
import type { PendingSalaryReconciliationRecord } from '../interfaces/pending-salary-reconciliation.interfaces';
import { FinalSettlementRepository } from '../repository/final-settlement.repository';
import { PendingSalaryReconciliationRepository } from '../repository/pending-salary-reconciliation.repository';
import { PendingSalaryReconciliationService } from '../service/pending-salary-reconciliation.service';

const TENANT_ID = 'tenant-test-001';
const SETTLEMENT_ID = 'settlement-001';

function mockLine(code: string): FinalSettlementRecord['lines'][number] {
  return {
    id: `line-${code}`,
    tenantId: TENANT_ID,
    settlementId: SETTLEMENT_ID,
    code,
    name: code,
    type: 'DEVENGO',
    origin: 'AUTOMATIC',
    conceptId: null,
    sourceReference: null,
    baseAmount: null,
    quantity: null,
    rate: null,
    amount: '100000.00',
    metadata: {},
    manualJustification: null,
    sortOrder: 10,
    createdAt: new Date(),
  };
}

function mockSettlement(overrides: Partial<FinalSettlementRecord> = {}): FinalSettlementRecord {
  return {
    id: SETTLEMENT_ID,
    tenantId: TENANT_ID,
    employeeDetailsId: 'emp-001',
    contractId: 'contract-001',
    effectiveTerminationDate: new Date('2024-06-30'),
    terminationReason: 'RENUNCIA' as ContractTerminationReason,
    status: FinalSettlementStatus.CALCULATED,
    mode: FinalSettlementMode.AUTOMATIC,
    snapshotContractType: EmployeeContractType.INDEFINIDO,
    snapshotContractStartDate: new Date('2020-01-01'),
    snapshotAgreedEndDate: null,
    snapshotSalaryType: SalaryType.ORDINARIO,
    snapshotSalaryAmount: '2000000.00',
    snapshotSmlvAmount: '1300000.00',
    snapshotTransportSubsidyAmount: '162000.00',
    snapshotFormulaVersion: 1,
    snapshotSmlvThreshold: '10.00',
    snapshotVariableAvgMonthsCovered: 0,
    snapshotVariableAvgTotal: '0.00',
    snapshotVariableAvgMonthly: '0.00',
    grossDevengados: '2100000.00',
    totalDeducciones: '0.00',
    netAmount: '2100000.00',
    snapshotNetNegativeAmount: '0.00',
    manualJustification: null,
    manualReference: null,
    manualResponsible: null,
    acceptedWarnings: [],
    auditTrail: [],
    createdBy: 'user-001',
    calculatedBy: 'user-001',
    calculatedAt: new Date(),
    approvedBy: null,
    approvedAt: null,
    paidBy: null,
    paidAt: null,
    paymentReference: null,
    paymentDate: null,
    voidedBy: null,
    voidedAt: null,
    voidReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lines: [mockLine('SAL_PENDIENTE')],
    ...overrides,
  };
}

function mockReconciliation(
  overrides: Partial<PendingSalaryReconciliationRecord> = {},
): PendingSalaryReconciliationRecord {
  return {
    id: 'reconciliation-001',
    tenantId: TENANT_ID,
    settlementId: SETTLEMENT_ID,
    previouslyPaidAmount: '0.00',
    paymentReference: null,
    paymentDate: null,
    responsible: 'Juan Pérez',
    observation: 'Verificado contra nómina previa',
    recognizedBalance: '100000.00',
    createdBy: 'user-001',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('PendingSalaryReconciliationService', (): void => {
  let service: PendingSalaryReconciliationService;
  let mockFindBySettlement: jest.Mock;
  let mockCreate: jest.Mock;
  let mockFinalSettlementFindById: jest.Mock;
  let mockAppendAuditEvent: jest.Mock;
  let mockAuditLog: jest.Mock;

  const validInput = {
    tenantId: TENANT_ID,
    settlementId: SETTLEMENT_ID,
    previouslyPaidAmount: '0.00',
    responsible: 'Juan Pérez',
    observation: 'Verificado contra nómina previa',
    recognizedBalance: '100000.00',
    createdBy: 'user-001',
  };

  beforeEach(async (): Promise<void> => {
    mockFindBySettlement = jest.fn().mockResolvedValue(null);
    mockCreate = jest.fn().mockResolvedValue(mockReconciliation());
    mockFinalSettlementFindById = jest.fn().mockResolvedValue(mockSettlement());
    mockAppendAuditEvent = jest.fn().mockResolvedValue(undefined);
    mockAuditLog = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PendingSalaryReconciliationService,
        {
          provide: PendingSalaryReconciliationRepository,
          useValue: { findBySettlement: mockFindBySettlement, create: mockCreate },
        },
        {
          provide: FinalSettlementRepository,
          useValue: {
            findById: mockFinalSettlementFindById,
            appendAuditEvent: mockAppendAuditEvent,
          },
        },
        { provide: AuditService, useValue: { log: mockAuditLog } },
      ],
    }).compile();

    service = module.get<PendingSalaryReconciliationService>(PendingSalaryReconciliationService);
  });

  describe('reconcile', (): void => {
    it('crea la reconciliación y agrega el evento PENDING_SALARY_RECONCILED al auditTrail', async (): Promise<void> => {
      const result = await service.reconcile(validInput);

      expect(mockCreate).toHaveBeenCalledWith(validInput);
      expect(mockAppendAuditEvent).toHaveBeenCalledWith(
        TENANT_ID,
        SETTLEMENT_ID,
        expect.objectContaining({ event: 'PENDING_SALARY_RECONCILED' }),
      );
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          action: AuditAction.CREATE,
          entityType: 'PendingSalaryReconciliation',
          payload: expect.objectContaining({ event: 'pending_salary_reconciled' }),
        }),
      );
      expect(result.recognizedBalance).toBe('100000.00');
    });

    it('lanza NotFoundException si la liquidación no existe', async (): Promise<void> => {
      mockFinalSettlementFindById.mockResolvedValue(null);

      await expect(service.reconcile(validInput)).rejects.toThrow(NotFoundException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si la liquidación no está en estado CALCULATED', async (): Promise<void> => {
      mockFinalSettlementFindById.mockResolvedValue(
        mockSettlement({ status: FinalSettlementStatus.APPROVED }),
      );

      await expect(service.reconcile(validInput)).rejects.toThrow(ConflictException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si la liquidación no tiene línea SAL_PENDIENTE', async (): Promise<void> => {
      mockFinalSettlementFindById.mockResolvedValue(
        mockSettlement({ lines: [mockLine('CESANTIAS')] }),
      );

      await expect(service.reconcile(validInput)).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si ya existe una reconciliación para esta liquidación', async (): Promise<void> => {
      mockFindBySettlement.mockResolvedValue(mockReconciliation());

      await expect(service.reconcile(validInput)).rejects.toThrow(ConflictException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si responsible está vacío', async (): Promise<void> => {
      await expect(service.reconcile({ ...validInput, responsible: '  ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException si observation está vacío', async (): Promise<void> => {
      await expect(service.reconcile({ ...validInput, observation: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('nunca borra ni modifica la advertencia original — solo agrega evidencia adicional', async (): Promise<void> => {
      // No hay ningún método de "editar warnings" invocado — solo create() + appendAuditEvent().
      await service.reconcile(validInput);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockAppendAuditEvent).toHaveBeenCalledTimes(1);
    });

    // ── Consistencia numérica (tasks/OS-591.md §15.2, cierre) ────────────────
    // La línea SAL_PENDIENTE de `mockSettlement()` tiene amount='100000.00' — ese es el
    // "salario causado" de referencia contra el que se validan estos montos.

    it('lanza BadRequestException si previouslyPaidAmount es negativo', async (): Promise<void> => {
      await expect(
        service.reconcile({ ...validInput, previouslyPaidAmount: '-1.00' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si recognizedBalance es negativo', async (): Promise<void> => {
      await expect(
        service.reconcile({ ...validInput, recognizedBalance: '-1.00' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si previouslyPaidAmount supera el salario causado', async (): Promise<void> => {
      await expect(
        service.reconcile({
          ...validInput,
          previouslyPaidAmount: '150000.00',
          recognizedBalance: '0.00',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si recognizedBalance supera el salario causado', async (): Promise<void> => {
      await expect(
        service.reconcile({
          ...validInput,
          previouslyPaidAmount: '0.00',
          recognizedBalance: '150000.00',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si previouslyPaidAmount + recognizedBalance supera el salario causado (saldo reconocido inconsistente)', async (): Promise<void> => {
      // Cada monto es individualmente <= causado, pero la suma no lo es.
      await expect(
        service.reconcile({
          ...validInput,
          previouslyPaidAmount: '60000.00',
          recognizedBalance: '60000.00',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('acepta previouslyPaidAmount + recognizedBalance exactamente igual al salario causado', async (): Promise<void> => {
      await expect(
        service.reconcile({
          ...validInput,
          previouslyPaidAmount: '40000.00',
          recognizedBalance: '60000.00',
        }),
      ).resolves.toBeDefined();
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('findBySettlement', (): void => {
    it('delega al repositorio', async (): Promise<void> => {
      mockFindBySettlement.mockResolvedValue(mockReconciliation());

      const result = await service.findBySettlement(TENANT_ID, SETTLEMENT_ID);

      expect(mockFindBySettlement).toHaveBeenCalledWith(TENANT_ID, SETTLEMENT_ID);
      expect(result?.settlementId).toBe(SETTLEMENT_ID);
    });
  });
});
