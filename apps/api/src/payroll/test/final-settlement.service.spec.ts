import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  type ContractTerminationReason,
  EmployeeContractType,
  FinalSettlementMode,
  FinalSettlementStatus,
  Prisma,
  SalaryType,
} from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import type { EmploymentContractRecord } from '../interfaces/employee-contract.interfaces';
import type {
  FinalSettlementRecord,
  SettlementAggregateResult,
} from '../interfaces/final-settlement.interfaces';
import type { IndemnificationFormulaValidationRecord } from '../interfaces/legal-formula-validation.interfaces';
import type { PendingSalaryReconciliationRecord } from '../interfaces/pending-salary-reconciliation.interfaces';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';
import { FinalSettlementRepository } from '../repository/final-settlement.repository';
import { LegalFormulaValidationRepository } from '../repository/legal-formula-validation.repository';
import { PendingSalaryReconciliationRepository } from '../repository/pending-salary-reconciliation.repository';
import { FinalSettlementAggregatorService } from '../service/final-settlement-aggregator.service';
import { FinalSettlementService } from '../service/final-settlement.service';

const TENANT_ID = 'tenant-001';
const EMPLOYEE_ID = 'emp-001';
const CONTRACT_ID = 'contract-001';
const SETTLEMENT_ID = 'settlement-001';

// ── Mock helpers ─────────────────────────────────────────────────────────────

function mockContract(overrides: Partial<EmploymentContractRecord> = {}): EmploymentContractRecord {
  return {
    id: CONTRACT_ID,
    tenantId: TENANT_ID,
    employeeDetailsId: EMPLOYEE_ID,
    contractType: EmployeeContractType.INDEFINIDO,
    startDate: new Date('2020-01-01'),
    agreedEndDate: null,
    status: 'ACTIVO',
    terminationDate: null,
    terminationReason: null,
    terminationNotes: null,
    activeSlot: true,
    changedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function mockAggregate(
  overrides: Partial<SettlementAggregateResult & { snapshots: object }> = {},
): SettlementAggregateResult & { snapshots: object } {
  return {
    lines: [],
    grossDevengados: '5000000.00',
    totalDeducciones: '0.00',
    netAmount: '5000000.00',
    netNegativeAmount: '0.00',
    warnings: [],
    blocks: [],
    snapshots: {
      monthlySalary: new Prisma.Decimal('2000000'),
      salaryType: 'ORDINARIO',
      smlvAmount: new Prisma.Decimal('1300000'),
      smlvThreshold: new Prisma.Decimal('10'),
      transportSubsidyAmount: new Prisma.Decimal('162000'),
      formulaVersion: 1,
      variableAvgMonthsCovered: 0,
      variableAvgTotal: new Prisma.Decimal('0'),
      variableAvgMonthly: new Prisma.Decimal('0'),
      contractType: 'INDEFINIDO',
      contractStartDate: new Date('2020-01-01'),
      agreedEndDate: null,
    },
    ...overrides,
  };
}

function mockSettlement(overrides: Partial<FinalSettlementRecord> = {}): FinalSettlementRecord {
  return {
    id: SETTLEMENT_ID,
    tenantId: TENANT_ID,
    employeeDetailsId: EMPLOYEE_ID,
    contractId: CONTRACT_ID,
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
    grossDevengados: '5000000.00',
    totalDeducciones: '0.00',
    netAmount: '5000000.00',
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
    lines: [],
    ...overrides,
  };
}

describe('FinalSettlementService', (): void => {
  let service: FinalSettlementService;
  let repository: jest.Mocked<FinalSettlementRepository>;
  let aggregator: jest.Mocked<FinalSettlementAggregatorService>;
  let contractRepository: jest.Mocked<EmployeeContractRepository>;
  let legalFormulaValidationRepository: jest.Mocked<LegalFormulaValidationRepository>;
  let pendingSalaryReconciliationRepository: jest.Mocked<PendingSalaryReconciliationRepository>;
  let auditService: jest.Mocked<AuditService>;

  // Named mock functions — avoids unbound-method rule
  let mockAggregateFn: jest.Mock;
  let mockFindById: jest.Mock;
  let mockFindAllByEmployee: jest.Mock;
  let mockCreate: jest.Mock;
  let mockRecalculate: jest.Mock;
  let mockVoid: jest.Mock;
  let mockApprove: jest.Mock;
  let mockMarkPaid: jest.Mock;
  let mockFindActiveContract: jest.Mock;
  let mockContractFindById: jest.Mock;
  let mockTerminateActiveContractTx: jest.Mock;
  let mockFindActiveLegalValidation: jest.Mock;
  let mockFindPendingSalaryReconciliation: jest.Mock;
  let mockAuditLog: jest.Mock;

  function mockLegalValidation(
    overrides: Partial<IndemnificationFormulaValidationRecord> = {},
  ): IndemnificationFormulaValidationRecord {
    return {
      id: 'legal-validation-001',
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
      createdAt: new Date('2026-01-01'),
      ...overrides,
    };
  }

  beforeEach(async (): Promise<void> => {
    mockAggregateFn = jest.fn().mockResolvedValue(mockAggregate());
    mockFindById = jest.fn();
    mockFindAllByEmployee = jest.fn().mockResolvedValue([]);
    mockCreate = jest.fn().mockResolvedValue(mockSettlement());
    mockRecalculate = jest.fn();
    mockVoid = jest.fn();
    mockMarkPaid = jest.fn();
    mockFindActiveContract = jest.fn().mockResolvedValue(mockContract());
    mockContractFindById = jest.fn().mockResolvedValue(mockContract());
    mockTerminateActiveContractTx = jest
      .fn()
      .mockResolvedValue(mockContract({ status: 'TERMINADO' }));
    mockFindActiveLegalValidation = jest.fn().mockResolvedValue(null);
    mockFindPendingSalaryReconciliation = jest.fn().mockResolvedValue(null);
    mockAuditLog = jest.fn().mockResolvedValue(undefined);

    // Simula el comportamiento transaccional real de `FinalSettlementRepository.approve`:
    // invoca el `sideEffect` recibido (que a su vez llama a
    // `contractRepository.terminateActiveContractTx`) ANTES de resolver — así los tests
    // pueden verificar que un `sideEffect` que rechaza también hace que `approve()` del
    // servicio rechace (mismo comportamiento que un rollback real de transacción).
    mockApprove = jest.fn(
      async (
        _data: unknown,
        sideEffect?: (tx: unknown) => Promise<void>,
      ): Promise<FinalSettlementRecord> => {
        if (sideEffect) {
          await sideEffect({});
        }
        return mockSettlement({ status: FinalSettlementStatus.APPROVED });
      },
    );

    repository = {
      findById: mockFindById,
      findAllByEmployee: mockFindAllByEmployee,
      findActiveByContract: jest.fn().mockResolvedValue(null),
      create: mockCreate,
      recalculate: mockRecalculate,
      void: mockVoid,
      approve: mockApprove,
      markPaid: mockMarkPaid,
      appendAuditEvent: jest.fn(),
    } as unknown as jest.Mocked<FinalSettlementRepository>;

    aggregator = {
      aggregate: mockAggregateFn,
    } as unknown as jest.Mocked<FinalSettlementAggregatorService>;

    contractRepository = {
      findActiveContract: mockFindActiveContract,
      findById: mockContractFindById,
      findAllByEmployee: jest.fn(),
      findContractAt: jest.fn(),
      createInitialContractTx: jest.fn(),
      syncActiveContractTx: jest.fn(),
      terminateActiveContractTx: mockTerminateActiveContractTx,
      startNewContractTx: jest.fn(),
    } as unknown as jest.Mocked<EmployeeContractRepository>;

    legalFormulaValidationRepository = {
      findActive: mockFindActiveLegalValidation,
      findAllByTenant: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<LegalFormulaValidationRepository>;

    pendingSalaryReconciliationRepository = {
      findBySettlement: mockFindPendingSalaryReconciliation,
      create: jest.fn(),
    } as unknown as jest.Mocked<PendingSalaryReconciliationRepository>;

    auditService = {
      log: mockAuditLog,
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalSettlementService,
        { provide: FinalSettlementRepository, useValue: repository },
        { provide: FinalSettlementAggregatorService, useValue: aggregator },
        { provide: EmployeeContractRepository, useValue: contractRepository },
        { provide: LegalFormulaValidationRepository, useValue: legalFormulaValidationRepository },
        {
          provide: PendingSalaryReconciliationRepository,
          useValue: pendingSalaryReconciliationRepository,
        },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<FinalSettlementService>(FinalSettlementService);
  });

  // ── preview ───────────────────────────────────────────────────────────────

  describe('preview', (): void => {
    it('delega al aggregator y retorna el resultado sin persistir', async (): Promise<void> => {
      // Arrange
      const input = {
        tenantId: TENANT_ID,
        employeeDetailsId: EMPLOYEE_ID,
        effectiveTerminationDate: new Date('2024-06-30'),
        terminationReason: 'RENUNCIA' as ContractTerminationReason,
      };

      // Act
      const result = await service.preview(input);

      // Assert
      expect(mockAggregateFn).toHaveBeenCalledTimes(1);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(result.grossDevengados).toBe('5000000.00');
    });

    it('preview puede devolver blocks sin lanzar excepción', async (): Promise<void> => {
      // Arrange
      mockAggregateFn.mockResolvedValueOnce(mockAggregate({ blocks: ['no_active_contract'] }));

      // Act
      const result = await service.preview({
        tenantId: TENANT_ID,
        employeeDetailsId: EMPLOYEE_ID,
        effectiveTerminationDate: new Date('2024-06-30'),
        terminationReason: 'RENUNCIA' as ContractTerminationReason,
      });

      // Assert — preview devuelve el bloqueo en vez de lanzar
      expect(result.blocks).toContain('no_active_contract');
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // ── calculateAndSave ──────────────────────────────────────────────────────

  describe('calculateAndSave', (): void => {
    const input = {
      tenantId: TENANT_ID,
      employeeDetailsId: EMPLOYEE_ID,
      effectiveTerminationDate: new Date('2024-06-30'),
      terminationReason: 'RENUNCIA' as ContractTerminationReason,
    };

    it('persiste la liquidación cuando no hay blocks', async (): Promise<void> => {
      // Act
      const result = await service.calculateAndSave(input);

      // Assert
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(SETTLEMENT_ID);
    });

    it('lanza ConflictException cuando hay blocks del aggregator', async (): Promise<void> => {
      // Arrange
      mockAggregateFn.mockResolvedValueOnce(mockAggregate({ blocks: ['no_active_contract'] }));

      // Act & Assert
      await expect(service.calculateAndSave(input)).rejects.toThrow(ConflictException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza ConflictException cuando el neto es negativo (bloqueo net_negative)', async (): Promise<void> => {
      // Neto negativo ya no es warning silencioso — el aggregator emite un BLOQUEO
      // Arrange
      mockAggregateFn.mockResolvedValueOnce(
        mockAggregate({
          grossDevengados: '100000.00',
          totalDeducciones: '200000.00',
          netAmount: '0.00',
          netNegativeAmount: '100000.00',
          blocks: ['net_negative — saldo a cargo del empleado: 100000.00 COP'],
        }),
      );

      // Act & Assert
      await expect(service.calculateAndSave(input)).rejects.toThrow(ConflictException);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si no hay contrato ACTIVO', async (): Promise<void> => {
      // Arrange
      mockFindActiveContract.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.calculateAndSave(input)).rejects.toThrow(NotFoundException);
    });

    it('MANUAL — lanza BadRequestException si falta manualJustification', async (): Promise<void> => {
      // Act & Assert
      await expect(
        service.calculateAndSave({ ...input, mode: FinalSettlementMode.MANUAL }),
      ).rejects.toThrow(BadRequestException);
    });

    it('MANUAL — persiste cuando los tres campos obligatorios están presentes', async (): Promise<void> => {
      // Act
      const result = await service.calculateAndSave({
        ...input,
        mode: FinalSettlementMode.MANUAL,
        manualJustification: 'Ajuste acordado',
        manualReference: 'REF-001',
        manualResponsible: 'Juan Pérez',
      });

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ mode: FinalSettlementMode.MANUAL }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── recalculate ───────────────────────────────────────────────────────────

  describe('recalculate', (): void => {
    it('recalcula una liquidación CALCULATED exitosamente', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.CALCULATED }));
      mockRecalculate.mockResolvedValue(mockSettlement());

      // Act
      const result = await service.recalculate(TENANT_ID, SETTLEMENT_ID, 'user-001');

      // Assert
      expect(mockRecalculate).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });

    it('bloquea el recálculo de una liquidación APPROVED', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.APPROVED }));

      // Act & Assert
      await expect(service.recalculate(TENANT_ID, SETTLEMENT_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('bloquea el recálculo de una liquidación PAID', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.PAID }));

      // Act & Assert
      await expect(service.recalculate(TENANT_ID, SETTLEMENT_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza NotFoundException si la liquidación no existe', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.recalculate(TENANT_ID, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('dos recálculos concurrentes del mismo settlement no generan estado inconsistente', async (): Promise<void> => {
      // Simulación: dos llamadas simultáneas; la segunda lanza ConflictException
      // porque el repositorio verifica el status DENTRO de la transacción.
      // En producción, Postgres serializa las transacciones — aquí el segundo mock
      // simula que el repositorio lanzó el error de concurrencia.
      // Arrange
      mockFindById
        .mockResolvedValueOnce(mockSettlement({ status: FinalSettlementStatus.CALCULATED }))
        .mockResolvedValueOnce(mockSettlement({ status: FinalSettlementStatus.CALCULATED }));

      mockRecalculate
        .mockResolvedValueOnce(mockSettlement())
        .mockRejectedValueOnce(new ConflictException('Conflicto de concurrencia en recálculo'));

      // Act — dos recálculos simultáneos
      const [result1, result2] = await Promise.allSettled([
        service.recalculate(TENANT_ID, SETTLEMENT_ID, 'user-001'),
        service.recalculate(TENANT_ID, SETTLEMENT_ID, 'user-002'),
      ]);

      // Assert — uno exitoso, el otro rechazado
      expect(result1.status).toBe('fulfilled');
      expect(result2.status).toBe('rejected');
    });
  });

  // ── void ─────────────────────────────────────────────────────────────────

  describe('void', (): void => {
    it('anula una liquidación CALCULATED con motivo', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.CALCULATED }));
      mockVoid.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.VOIDED }));

      // Act
      const result = await service.void(TENANT_ID, SETTLEMENT_ID, 'Error de datos', 'user-001');

      // Assert
      expect(mockVoid).toHaveBeenCalledWith(
        expect.objectContaining({ voidReason: 'Error de datos' }),
      );
      expect(result.status).toBe(FinalSettlementStatus.VOIDED);
    });

    it('lanza ConflictException al anular una liquidación ya anulada', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.VOIDED }));

      // Act & Assert
      await expect(service.void(TENANT_ID, SETTLEMENT_ID, 'Motivo')).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza ConflictException al anular una liquidación PAID', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.PAID }));

      // Act & Assert
      await expect(service.void(TENANT_ID, SETTLEMENT_ID, 'Motivo')).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza ConflictException al anular una liquidación APPROVED — ya disparó la terminación del contrato (§15.3)', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.APPROVED }));

      // Act & Assert
      await expect(service.void(TENANT_ID, SETTLEMENT_ID, 'Motivo')).rejects.toThrow(
        ConflictException,
      );
      expect(mockVoid).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si voidReason está vacío', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.CALCULATED }));

      // Act & Assert
      await expect(service.void(TENANT_ID, SETTLEMENT_ID, '')).rejects.toThrow(BadRequestException);
    });
  });

  // ── createManual ──────────────────────────────────────────────────────────

  describe('createManual', (): void => {
    const manualInput = {
      tenantId: TENANT_ID,
      employeeDetailsId: EMPLOYEE_ID,
      effectiveTerminationDate: new Date('2024-06-30'),
      terminationReason: 'JUSTA_CAUSA' as ContractTerminationReason,
      lines: [
        {
          code: 'AJUSTE_MANUAL',
          name: 'Ajuste manual',
          type: 'DEVENGO' as const,
          amount: new Prisma.Decimal('1000000'),
          manualJustification: 'Acuerdo documentado',
        },
      ],
      manualJustification: 'Liquidación por acuerdo',
      manualReference: 'DOC-001',
      manualResponsible: 'Juan Pérez',
      createdBy: 'user-001',
    };

    it('crea la liquidación manual cuando todos los campos están presentes', async (): Promise<void> => {
      // Arrange
      mockCreate.mockResolvedValue(mockSettlement({ mode: FinalSettlementMode.MANUAL }));

      // Act
      const result = await service.createManual(manualInput);

      // Assert — contractId se resuelve server-side vía findActiveContract, no del input
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ mode: FinalSettlementMode.MANUAL, contractId: CONTRACT_ID }),
      );
      expect(result).toBeDefined();
    });

    it('lanza BadRequestException si falta manualJustification', async (): Promise<void> => {
      // Act & Assert
      await expect(
        service.createManual({ ...manualInput, manualJustification: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si una línea no tiene justificación', async (): Promise<void> => {
      // Act & Assert
      await expect(
        service.createManual({
          ...manualInput,
          lines: [{ ...manualInput.lines[0], manualJustification: '' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si el empleado no tiene contrato ACTIVO', async (): Promise<void> => {
      // Arrange
      mockFindActiveContract.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.createManual(manualInput)).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si lines está vacío', async (): Promise<void> => {
      // Una liquidación manual sin líneas no es auditable
      // Act & Assert
      await expect(service.createManual({ ...manualInput, lines: [] })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── approve ───────────────────────────────────────────────────────────────

  describe('approve', (): void => {
    const indemnLine = {
      id: 'line-1',
      tenantId: TENANT_ID,
      settlementId: SETTLEMENT_ID,
      code: 'INDEMNIZACION',
      name: 'Indemnización',
      type: 'DEVENGO' as const,
      origin: 'AUTOMATIC' as const,
      sourceReference: null,
      baseAmount: null,
      quantity: null,
      rate: null,
      amount: '1000000.00',
      metadata: {},
      manualJustification: null,
      sortOrder: 50,
      createdAt: new Date(),
    };

    const pendingSalaryLine = {
      ...indemnLine,
      id: 'line-2',
      code: 'SAL_PENDIENTE',
      name: 'Salario pendiente',
      sortOrder: 10,
    };

    it('aprueba una liquidación CALCULATED sin indemnización ni salario pendiente', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({ status: FinalSettlementStatus.CALCULATED, lines: [] }),
      );
      // La agregación de líneas vacías bloquearía por empty_settlement — usar una línea neutra
      mockFindById.mockResolvedValue(
        mockSettlement({
          status: FinalSettlementStatus.CALCULATED,
          lines: [{ ...indemnLine, code: 'CESANTIAS', name: 'Cesantías' }],
        }),
      );

      // Act
      const result = await service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001');

      // Assert
      expect(mockTerminateActiveContractTx).toHaveBeenCalledTimes(1);
      expect(mockApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          id: SETTLEMENT_ID,
          approvedBy: 'approver-001',
        }),
        expect.any(Function),
      );
      expect(result.status).toBe(FinalSettlementStatus.APPROVED);
      expect(mockAuditLog).toHaveBeenCalled();
    });

    it('lanza ConflictException si la liquidación no tiene líneas (empty_settlement)', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({ status: FinalSettlementStatus.CALCULATED, lines: [] }),
      );

      // Act & Assert
      await expect(service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001')).rejects.toThrow(
        ConflictException,
      );
      expect(mockTerminateActiveContractTx).not.toHaveBeenCalled();
      expect(mockApprove).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si la indemnización automática no tiene validación legal activa', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({
          status: FinalSettlementStatus.CALCULATED,
          mode: FinalSettlementMode.AUTOMATIC,
          lines: [indemnLine],
        }),
      );
      mockFindActiveLegalValidation.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001')).rejects.toThrow(
        ConflictException,
      );
      expect(mockTerminateActiveContractTx).not.toHaveBeenCalled();
    });

    it('aprueba una liquidación con indemnización cuando existe una validación legal activa para la versión usada', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({
          status: FinalSettlementStatus.CALCULATED,
          mode: FinalSettlementMode.AUTOMATIC,
          snapshotFormulaVersion: 1,
          lines: [indemnLine],
        }),
      );
      mockFindActiveLegalValidation.mockResolvedValue(mockLegalValidation({ formulaVersion: 1 }));

      // Act
      const result = await service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001');

      // Assert
      expect(mockFindActiveLegalValidation).toHaveBeenCalledWith(TENANT_ID, 1);
      expect(result.status).toBe(FinalSettlementStatus.APPROVED);
    });

    it('no exige validación legal para una liquidación MANUAL con línea INDEMNIZACION (el gate es solo AUTOMATIC)', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({
          status: FinalSettlementStatus.CALCULATED,
          mode: FinalSettlementMode.MANUAL,
          manualJustification: 'Acuerdo',
          manualReference: 'REF-1',
          manualResponsible: 'Juan Pérez',
          lines: [indemnLine],
        }),
      );

      // Act
      await service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001');

      // Assert
      expect(mockFindActiveLegalValidation).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si hay salario pendiente sin reconciliación registrada', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({ status: FinalSettlementStatus.CALCULATED, lines: [pendingSalaryLine] }),
      );
      mockFindPendingSalaryReconciliation.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001')).rejects.toThrow(
        ConflictException,
      );
      expect(mockTerminateActiveContractTx).not.toHaveBeenCalled();
    });

    it('aprueba cuando el salario pendiente ya fue reconciliado', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({ status: FinalSettlementStatus.CALCULATED, lines: [pendingSalaryLine] }),
      );
      mockFindPendingSalaryReconciliation.mockResolvedValue(mockReconciliation());

      // Act
      const result = await service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001');

      // Assert
      expect(result.status).toBe(FinalSettlementStatus.APPROVED);
    });

    it('MANUAL — no evade el gate de aprobación si falta soporte (manualResponsible vacío)', async (): Promise<void> => {
      // Cierra el hallazgo de Fase 2: MANUAL no bypassa los gates de APPROVED/PAID.
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({
          status: FinalSettlementStatus.CALCULATED,
          mode: FinalSettlementMode.MANUAL,
          manualJustification: 'Acuerdo',
          manualReference: 'REF-1',
          manualResponsible: null,
          lines: [{ ...indemnLine, code: 'AJUSTE_MANUAL' }],
        }),
      );

      // Act & Assert
      await expect(service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001')).rejects.toThrow(
        ConflictException,
      );
      expect(mockTerminateActiveContractTx).not.toHaveBeenCalled();
      expect(mockApprove).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si el estado actual no es CALCULATED', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.APPROVED }));

      // Act & Assert
      await expect(service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001')).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza NotFoundException si la liquidación no existe', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approve(TENANT_ID, 'non-existent', 'approver-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException si approvedBy está vacío', async (): Promise<void> => {
      // Act & Assert
      await expect(service.approve(TENANT_ID, SETTLEMENT_ID, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('si terminateActiveContract falla dentro de la transacción, approve() propaga el error (atomicidad — §15.3/§15.4)', async (): Promise<void> => {
      // Arrange — `mockApprove` invoca el `sideEffect` (igual que la transacción real de
      // `FinalSettlementRepository.approve`); si ese sideEffect rechaza, `repository.approve`
      // rechaza también — exactamente el comportamiento de un rollback real: la liquidación
      // nunca se actualiza a APPROVED porque la transacción completa no llegó a comprometerse.
      mockFindById.mockResolvedValue(
        mockSettlement({
          status: FinalSettlementStatus.CALCULATED,
          lines: [{ ...indemnLine, code: 'CESANTIAS' }],
        }),
      );
      mockTerminateActiveContractTx.mockRejectedValueOnce(
        new ConflictException('El empleado no tiene un contrato ACTIVO para terminar'),
      );

      // Act & Assert
      await expect(service.approve(TENANT_ID, SETTLEMENT_ID, 'approver-001')).rejects.toThrow(
        ConflictException,
      );
      // El intento de transacción sí ocurrió (mockApprove fue invocado e internamente
      // llamó al sideEffect que falló) — lo que NO ocurre es que se complete/persista.
      expect(mockApprove).toHaveBeenCalled();
      expect(mockTerminateActiveContractTx).toHaveBeenCalledTimes(1);
      // Ningún evento de auditoría general debe emitirse tras un rollback.
      expect(mockAuditLog).not.toHaveBeenCalled();
    });
  });

  // ── markPaid ──────────────────────────────────────────────────────────────

  describe('markPaid', (): void => {
    const validPayment = {
      paidBy: 'payer-001',
      paymentReference: 'TRF-2026-0001',
      paymentDate: new Date('2026-01-10'),
    };

    it('marca como pagada una liquidación APPROVED, validando referencia/fecha/actor/importe', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({
          status: FinalSettlementStatus.APPROVED,
          approvedAt: new Date('2026-01-01'),
        }),
      );
      mockMarkPaid.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.PAID }));

      // Act
      const result = await service.markPaid(TENANT_ID, SETTLEMENT_ID, validPayment);

      // Assert
      expect(mockMarkPaid).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        id: SETTLEMENT_ID,
        paidBy: 'payer-001',
        paymentReference: 'TRF-2026-0001',
        paymentDate: validPayment.paymentDate,
      });
      expect(result.status).toBe(FinalSettlementStatus.PAID);
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            event: 'final_settlement_paid',
            netAmount: expect.any(String),
            paymentReference: 'TRF-2026-0001',
          }),
        }),
      );
    });

    it('lanza ConflictException si el estado actual no es APPROVED', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.CALCULATED }));

      // Act & Assert
      await expect(service.markPaid(TENANT_ID, SETTLEMENT_ID, validPayment)).rejects.toThrow(
        ConflictException,
      );
      expect(mockMarkPaid).not.toHaveBeenCalled();
    });

    it('DOBLE PAGO — reintentar markPaid sobre una liquidación ya PAID es un conflicto explícito, no un no-op', async (): Promise<void> => {
      // Arrange — la liquidación ya quedó PAID tras el primer markPaid exitoso.
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.PAID }));

      // Act & Assert — el segundo intento (mismo request reintentado, o un segundo pago
      // real por error) SIEMPRE rechaza con 409; no hay clave de idempotencia que permita
      // distinguir ambos casos, así que no se asume que reintentar es seguro.
      await expect(service.markPaid(TENANT_ID, SETTLEMENT_ID, validPayment)).rejects.toThrow(
        ConflictException,
      );
      expect(mockMarkPaid).not.toHaveBeenCalled();
    });

    it('CARRERA — dos markPaid concurrentes: uno tiene éxito, el otro rechaza (conflicto de concurrencia)', async (): Promise<void> => {
      // Arrange — ambos leen APPROVED antes de que cualquiera escriba; el repositorio real
      // resuelve la carrera vía update condicional (`where: { status: APPROVED }`), aquí
      // simulado directamente en el mock del repositorio.
      mockFindById.mockResolvedValue(mockSettlement({ status: FinalSettlementStatus.APPROVED }));
      mockMarkPaid
        .mockResolvedValueOnce(mockSettlement({ status: FinalSettlementStatus.PAID }))
        .mockRejectedValueOnce(new ConflictException('Conflicto de concurrencia'));

      // Act
      const [result1, result2] = await Promise.allSettled([
        service.markPaid(TENANT_ID, SETTLEMENT_ID, validPayment),
        service.markPaid(TENANT_ID, SETTLEMENT_ID, validPayment),
      ]);

      // Assert
      expect(result1.status).toBe('fulfilled');
      expect(result2.status).toBe('rejected');
    });

    it('lanza NotFoundException si la liquidación no existe', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.markPaid(TENANT_ID, 'non-existent', validPayment)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException si paidBy está vacío', async (): Promise<void> => {
      // Act & Assert
      await expect(
        service.markPaid(TENANT_ID, SETTLEMENT_ID, { ...validPayment, paidBy: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si paymentReference está vacío', async (): Promise<void> => {
      // Act & Assert
      await expect(
        service.markPaid(TENANT_ID, SETTLEMENT_ID, { ...validPayment, paymentReference: '  ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si paymentDate es inválida', async (): Promise<void> => {
      // Act & Assert
      await expect(
        service.markPaid(TENANT_ID, SETTLEMENT_ID, {
          ...validPayment,
          paymentDate: new Date('not-a-date'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si paymentDate está en el futuro', async (): Promise<void> => {
      // Act & Assert
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      await expect(
        service.markPaid(TENANT_ID, SETTLEMENT_ID, { ...validPayment, paymentDate: future }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si paymentDate es anterior a la fecha de aprobación', async (): Promise<void> => {
      // Arrange
      mockFindById.mockResolvedValue(
        mockSettlement({
          status: FinalSettlementStatus.APPROVED,
          approvedAt: new Date('2026-02-01'),
        }),
      );

      // Act & Assert
      await expect(
        service.markPaid(TENANT_ID, SETTLEMENT_ID, {
          ...validPayment,
          paymentDate: new Date('2026-01-01'),
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockMarkPaid).not.toHaveBeenCalled();
    });
  });

  // ── Aislamiento multi-tenant ──────────────────────────────────────────────

  describe('aislamiento multi-tenant', (): void => {
    it('findAllByEmployee filtra siempre por tenantId', async (): Promise<void> => {
      // Arrange
      mockFindAllByEmployee.mockResolvedValue([]);

      // Act
      await service.findAllByEmployee('tenant-A', EMPLOYEE_ID);

      // Assert
      expect(mockFindAllByEmployee).toHaveBeenCalledWith('tenant-A', EMPLOYEE_ID);
    });
  });
});
