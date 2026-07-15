import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  type ContractTerminationReason,
  EmployeeContractType,
  FinalSettlementMode,
  FinalSettlementStatus,
  Prisma,
  SalaryType,
  SettlementLineOrigin,
  SettlementLineType,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateFinalSettlementData,
  FinalSettlementRecord,
} from '../interfaces/final-settlement.interfaces';
import { FinalSettlementRepository } from '../repository/final-settlement.repository';

const TENANT_ID = 'tenant-test-001';
const CONTRACT_ID = 'contract-001';
const EMPLOYEE_ID = 'emp-001';

// Helper to access mock.calls in a type-safe way (same pattern as cesantias.service.spec.ts).
type CreateCallData = { data: { auditTrail: Array<{ event: string }>; mode: FinalSettlementMode } };
function getCreateCallData(mockFn: jest.Mock, callIndex = 0): CreateCallData {
  return (mockFn.mock.calls as CreateCallData[][])[callIndex][0];
}

const baseCreate = (): CreateFinalSettlementData => ({
  tenantId: TENANT_ID,
  employeeDetailsId: EMPLOYEE_ID,
  contractId: CONTRACT_ID,
  effectiveTerminationDate: new Date('2024-06-30'),
  terminationReason: 'RENUNCIA' as ContractTerminationReason,
  mode: FinalSettlementMode.AUTOMATIC,
  snapshotContractType: EmployeeContractType.INDEFINIDO,
  snapshotContractStartDate: new Date('2020-01-01'),
  snapshotAgreedEndDate: null,
  snapshotSalaryType: SalaryType.ORDINARIO,
  snapshotSalaryAmount: new Prisma.Decimal('2000000'),
  snapshotSmlvAmount: new Prisma.Decimal('1300000'),
  snapshotTransportSubsidyAmount: new Prisma.Decimal('162000'),
  snapshotFormulaVersion: 1,
  snapshotSmlvThreshold: new Prisma.Decimal('10'),
  snapshotVariableAvgMonthsCovered: 0,
  snapshotVariableAvgTotal: new Prisma.Decimal('0'),
  snapshotVariableAvgMonthly: new Prisma.Decimal('0'),
  grossDevengados: new Prisma.Decimal('5000000'),
  totalDeducciones: new Prisma.Decimal('0'),
  netAmount: new Prisma.Decimal('5000000'),
  snapshotNetNegativeAmount: new Prisma.Decimal('0'),
  lines: [
    {
      code: 'SAL_PENDIENTE',
      name: 'Salario pendiente',
      type: SettlementLineType.DEVENGO,
      origin: SettlementLineOrigin.AUTOMATIC,
      amount: new Prisma.Decimal('5000000'),
      sortOrder: 10,
    },
  ],
  acceptedWarnings: [],
  createdBy: 'user-test',
});

describe('FinalSettlementRepository', (): void => {
  let repository: FinalSettlementRepository;
  let prisma: jest.Mocked<PrismaService>;

  // Individual mock functions for cleaner assertions
  let mockFindFirst: jest.Mock;
  let mockFindMany: jest.Mock;
  let mockCreate: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockUpdateMany: jest.Mock;
  let mockDeleteMany: jest.Mock;

  beforeEach((): void => {
    mockFindFirst = jest.fn();
    mockFindMany = jest.fn();
    mockCreate = jest.fn();
    mockUpdate = jest.fn();
    mockUpdateMany = jest.fn();
    mockDeleteMany = jest.fn();

    prisma = {
      finalSettlement: {
        findFirst: mockFindFirst,
        findMany: mockFindMany,
        create: mockCreate,
        update: mockUpdate,
        updateMany: mockUpdateMany,
      },
      settlementLine: {
        deleteMany: mockDeleteMany,
      },
      $transaction: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>;
  });

  async function makeRepository(): Promise<FinalSettlementRepository> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinalSettlementRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return module.get<FinalSettlementRepository>(FinalSettlementRepository);
  }

  // ── findActiveByContract ────────────────────────────────────────────────

  describe('findActiveByContract', (): void => {
    it('devuelve null cuando no existe liquidación activa para el contrato', async (): Promise<void> => {
      // Arrange
      mockFindFirst.mockResolvedValue(null);
      repository = await makeRepository();

      // Act
      const result = await repository.findActiveByContract(TENANT_ID, CONTRACT_ID);

      // Assert
      expect(result).toBeNull();
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contractId: CONTRACT_ID,
            status: { not: FinalSettlementStatus.VOIDED },
          }),
        }),
      );
    });

    it('filtra por tenantId para aislamiento multi-tenant', async (): Promise<void> => {
      // Arrange
      mockFindFirst.mockResolvedValue(null);
      repository = await makeRepository();

      // Act
      await repository.findActiveByContract(TENANT_ID, CONTRACT_ID);

      // Assert
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID }),
        }),
      );
    });
  });

  // ── create — invariante de una liquidación activa por contrato ──────────

  describe('create', (): void => {
    it('lanza ConflictException si ya existe una liquidación activa para el contrato', async (): Promise<void> => {
      // Arrange — simular que findActiveByContract devuelve una liquidación existente
      const existingRow = buildMockRow({ status: FinalSettlementStatus.CALCULATED });
      mockFindFirst.mockResolvedValueOnce(existingRow);
      repository = await makeRepository();

      // Act & Assert
      await expect(repository.create(baseCreate())).rejects.toThrow(ConflictException);
    });

    it('crea la liquidación cuando no existe ninguna activa', async (): Promise<void> => {
      // Arrange
      mockFindFirst.mockResolvedValueOnce(null);
      const createdRow = buildMockRow({ status: FinalSettlementStatus.CALCULATED });
      mockCreate.mockResolvedValue(createdRow);
      repository = await makeRepository();

      // Act
      const result = await repository.create(baseCreate());

      // Assert
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(FinalSettlementStatus.CALCULATED);
    });

    it('incluye evento DRAFT_CREATED en auditTrail para modo AUTOMATIC', async (): Promise<void> => {
      // Arrange
      mockFindFirst.mockResolvedValueOnce(null);
      const createdRow = buildMockRow({});
      mockCreate.mockResolvedValue(createdRow);
      repository = await makeRepository();

      // Act
      await repository.create(baseCreate());

      // Assert
      const { data } = getCreateCallData(mockCreate);
      const auditTrail = data.auditTrail;
      expect(auditTrail[0].event).toBe('DRAFT_CREATED');
    });

    it('incluye evento MANUAL_CREATED para modo MANUAL', async (): Promise<void> => {
      // Arrange
      mockFindFirst.mockResolvedValueOnce(null);
      const createdRow = buildMockRow({});
      mockCreate.mockResolvedValue(createdRow);
      repository = await makeRepository();

      // Act
      await repository.create({ ...baseCreate(), mode: FinalSettlementMode.MANUAL });

      // Assert
      const { data } = getCreateCallData(mockCreate);
      const auditTrail = data.auditTrail;
      expect(auditTrail[0].event).toBe('MANUAL_CREATED');
    });
  });

  // ── create — invariante de base de datos (P2002) ────────────────────────

  describe('create — constraint violation P2002', (): void => {
    it('convierte error P2002 (unique partial index) en ConflictException', async (): Promise<void> => {
      // Arrange — simular que no hay liquidación activa (pasa check de app-level)
      // pero Prisma lanza P2002 (carrera concurrente, índice parcial violado)
      mockFindFirst.mockResolvedValueOnce(null); // findActiveByContract = null
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`tenantId`,`contractId`)',
        { code: 'P2002', clientVersion: '5.0.0', meta: { target: ['tenantId', 'contractId'] } },
      );
      mockCreate.mockRejectedValueOnce(p2002Error);
      repository = await makeRepository();

      // Act & Assert
      await expect(repository.create(baseCreate())).rejects.toThrow(ConflictException);
    });
  });

  // ── void ────────────────────────────────────────────────────────────────

  describe('void', (): void => {
    it('agrega evento VOIDED al auditTrail', async (): Promise<void> => {
      // Arrange — findById devuelve una liquidación existente
      const existingRecord = buildMappedRecord({ status: FinalSettlementStatus.CALCULATED });
      repository = await makeRepository();
      jest.spyOn(repository, 'findById').mockResolvedValue(existingRecord);

      const voidedRow = buildMockRow({ status: FinalSettlementStatus.VOIDED });
      mockUpdate.mockResolvedValue(voidedRow);

      // Act
      await repository.void({
        tenantId: TENANT_ID,
        id: existingRecord.id,
        voidReason: 'Error de datos',
        voidedBy: 'user-test',
      });

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: FinalSettlementStatus.VOIDED,
            voidReason: 'Error de datos',
          }),
        }),
      );
    });
  });

  // ── approve — atomicidad (tasks/OS-591.md §15.3/§15.4) ──────────────────
  //
  // `approve` abre su propia transacción (`prisma.$transaction`) — igual patrón que
  // `recalculate`: re-lee el estado DENTRO de la transacción y solo entonces actualiza.
  // El mock de `$transaction` invoca el callback con un "tx" que reutiliza los mismos
  // mocks de `finalSettlement` (duck-typing, mismo criterio que el resto del archivo).

  describe('approve', (): void => {
    let mockTransaction: jest.Mock;

    beforeEach((): void => {
      mockTransaction = jest.fn(
        async (cb: (tx: unknown) => Promise<unknown>): Promise<unknown> =>
          cb({ finalSettlement: { findFirst: mockFindFirst, update: mockUpdate } }),
      );
      (prisma as unknown as { $transaction: jest.Mock }).$transaction = mockTransaction;
    });

    it('transiciona CALCULATED → APPROVED dentro de una transacción', async (): Promise<void> => {
      // Arrange
      mockFindFirst.mockResolvedValue({ status: FinalSettlementStatus.CALCULATED, auditTrail: [] });
      mockUpdate.mockResolvedValue(buildMockRow({ status: FinalSettlementStatus.APPROVED }));
      repository = await makeRepository();

      // Act
      const result = await repository.approve({
        tenantId: TENANT_ID,
        id: 'settlement-001',
        approvedBy: 'approver-001',
      });

      // Assert
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'settlement-001' },
          data: expect.objectContaining({
            status: FinalSettlementStatus.APPROVED,
            approvedBy: 'approver-001',
          }),
        }),
      );
      expect(result.status).toBe(FinalSettlementStatus.APPROVED);
    });

    it('lanza ConflictException si el estado ya no es CALCULATED (carrera) y NO actualiza', async (): Promise<void> => {
      // Arrange — otra aprobación concurrente ya cambió el estado antes de que esta
      // transacción alcanzara a leerlo.
      mockFindFirst.mockResolvedValue({ status: FinalSettlementStatus.APPROVED, auditTrail: [] });
      repository = await makeRepository();

      // Act & Assert
      await expect(
        repository.approve({
          tenantId: TENANT_ID,
          id: 'settlement-001',
          approvedBy: 'approver-001',
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('agrega evento APPROVED al auditTrail', async (): Promise<void> => {
      // Arrange
      mockFindFirst.mockResolvedValue({
        status: FinalSettlementStatus.CALCULATED,
        auditTrail: [{ event: 'CALCULATED', actor: 'seed', timestamp: '2026-01-01T00:00:00.000Z' }],
      });
      mockUpdate.mockResolvedValue(buildMockRow({ status: FinalSettlementStatus.APPROVED }));
      repository = await makeRepository();

      // Act
      await repository.approve({
        tenantId: TENANT_ID,
        id: 'settlement-001',
        approvedBy: 'approver-001',
      });

      // Assert
      type UpdateCallData = { data: { auditTrail: Array<{ event: string }> } };
      const [call] = mockUpdate.mock.calls as UpdateCallData[][];
      expect(call[0].data.auditTrail).toHaveLength(2);
      expect(call[0].data.auditTrail.at(-1)?.event).toBe('APPROVED');
    });

    it('ejecuta el sideEffect DENTRO de la transacción, antes de actualizar el estado', async (): Promise<void> => {
      // Arrange — simula terminar el contrato activo (§15.4) como side effect atómico.
      const callOrder: string[] = [];
      mockFindFirst.mockResolvedValue({ status: FinalSettlementStatus.CALCULATED, auditTrail: [] });
      mockUpdate.mockImplementation((): Promise<unknown> => {
        callOrder.push('update');
        return Promise.resolve(buildMockRow({ status: FinalSettlementStatus.APPROVED }));
      });
      const sideEffect = jest.fn(
        (): Promise<void> => Promise.resolve(void callOrder.push('sideEffect')),
      );
      repository = await makeRepository();

      // Act
      await repository.approve(
        { tenantId: TENANT_ID, id: 'settlement-001', approvedBy: 'approver-001' },
        sideEffect,
      );

      // Assert
      expect(sideEffect).toHaveBeenCalledTimes(1);
      expect(sideEffect).toHaveBeenCalledWith({
        finalSettlement: { findFirst: mockFindFirst, update: mockUpdate },
      });
      expect(callOrder).toEqual(['sideEffect', 'update']);
    });

    it('si el sideEffect lanza, la transacción no actualiza el estado (rollback)', async (): Promise<void> => {
      // Arrange
      mockFindFirst.mockResolvedValue({ status: FinalSettlementStatus.CALCULATED, auditTrail: [] });
      const sideEffect = jest
        .fn()
        .mockRejectedValue(new ConflictException('El contrato ya no está ACTIVO'));
      repository = await makeRepository();

      // Act & Assert
      await expect(
        repository.approve(
          { tenantId: TENANT_ID, id: 'settlement-001', approvedBy: 'approver-001' },
          sideEffect,
        ),
      ).rejects.toThrow(ConflictException);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ── markPaid ────────────────────────────────────────────────────────────

  describe('markPaid', (): void => {
    const paymentData = {
      paidBy: 'payer-001',
      paymentReference: 'TRF-2026-0001',
      paymentDate: new Date('2026-01-10'),
    };

    it('transiciona APPROVED → PAID con update condicional por estado, persistiendo referencia y fecha', async (): Promise<void> => {
      // Arrange
      const existingRecord = buildMappedRecord({ status: FinalSettlementStatus.APPROVED });
      repository = await makeRepository();
      jest.spyOn(repository, 'findById').mockResolvedValue(existingRecord);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      // Act
      await repository.markPaid({ tenantId: TENANT_ID, id: existingRecord.id, ...paymentData });

      // Assert
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          id: existingRecord.id,
          tenantId: TENANT_ID,
          status: FinalSettlementStatus.APPROVED,
        },
        data: expect.objectContaining({
          status: FinalSettlementStatus.PAID,
          paidBy: 'payer-001',
          paymentReference: 'TRF-2026-0001',
          paymentDate: paymentData.paymentDate,
        }),
      });
    });

    it('lanza ConflictException por carrera si el estado cambió antes del update (count=0)', async (): Promise<void> => {
      // Arrange
      const existingRecord = buildMappedRecord({ status: FinalSettlementStatus.APPROVED });
      repository = await makeRepository();
      jest.spyOn(repository, 'findById').mockResolvedValue(existingRecord);
      mockUpdateMany.mockResolvedValue({ count: 0 });

      // Act & Assert
      await expect(
        repository.markPaid({ tenantId: TENANT_ID, id: existingRecord.id, ...paymentData }),
      ).rejects.toThrow(ConflictException);
    });

    it('DOBLE PAGO a nivel de repositorio: markPaid sobre una liquidación ya PAID no encuentra filas APPROVED (count=0) y rechaza', async (): Promise<void> => {
      // Arrange — el WHERE exige status=APPROVED; una liquidación ya PAID nunca lo cumple.
      const existingRecord = buildMappedRecord({ status: FinalSettlementStatus.PAID });
      repository = await makeRepository();
      jest.spyOn(repository, 'findById').mockResolvedValue(existingRecord);
      mockUpdateMany.mockResolvedValue({ count: 0 });

      // Act & Assert
      await expect(
        repository.markPaid({ tenantId: TENANT_ID, id: existingRecord.id, ...paymentData }),
      ).rejects.toThrow(ConflictException);
      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: FinalSettlementStatus.APPROVED }),
        }),
      );
    });
  });

  // ── appendAuditEvent ────────────────────────────────────────────────────

  describe('appendAuditEvent', (): void => {
    it('agrega el evento al auditTrail existente sin tocar status ni otros campos', async (): Promise<void> => {
      // Arrange
      const existingRecord = buildMappedRecord({ status: FinalSettlementStatus.CALCULATED });
      repository = await makeRepository();
      jest.spyOn(repository, 'findById').mockResolvedValue(existingRecord);
      mockUpdate.mockResolvedValue(buildMockRow({ status: FinalSettlementStatus.CALCULATED }));

      // Act
      await repository.appendAuditEvent(TENANT_ID, existingRecord.id, {
        event: 'PENDING_SALARY_RECONCILED',
        actor: 'user-001',
        timestamp: new Date().toISOString(),
      });

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: existingRecord.id },
        data: {
          auditTrail: expect.arrayContaining([
            expect.objectContaining({ event: 'PENDING_SALARY_RECONCILED' }),
          ]),
        },
      });
    });
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  function buildMockRow(overrides: Partial<{ status: FinalSettlementStatus }>): {
    id: string;
    tenantId: string;
    employeeDetailsId: string;
    contractId: string;
    effectiveTerminationDate: Date;
    terminationReason: ContractTerminationReason;
    status: FinalSettlementStatus;
    mode: FinalSettlementMode;
    snapshotContractType: EmployeeContractType;
    snapshotContractStartDate: Date;
    snapshotAgreedEndDate: null;
    snapshotSalaryType: SalaryType;
    snapshotSalaryAmount: Prisma.Decimal;
    snapshotSmlvAmount: Prisma.Decimal;
    snapshotTransportSubsidyAmount: Prisma.Decimal;
    snapshotFormulaVersion: number;
    snapshotSmlvThreshold: Prisma.Decimal;
    snapshotVariableAvgMonthsCovered: number;
    snapshotVariableAvgTotal: Prisma.Decimal;
    snapshotVariableAvgMonthly: Prisma.Decimal;
    grossDevengados: Prisma.Decimal;
    totalDeducciones: Prisma.Decimal;
    netAmount: Prisma.Decimal;
    snapshotNetNegativeAmount: Prisma.Decimal;
    manualJustification: null;
    manualReference: null;
    manualResponsible: null;
    acceptedWarnings: never[];
    auditTrail: never[];
    createdBy: string;
    calculatedBy: string;
    calculatedAt: Date;
    approvedBy: null;
    approvedAt: null;
    paidBy: null;
    paidAt: null;
    paymentReference: null;
    paymentDate: null;
    voidedBy: null;
    voidedAt: null;
    voidReason: null;
    createdAt: Date;
    updatedAt: Date;
    lines: never[];
  } {
    return {
      id: 'settlement-001',
      tenantId: TENANT_ID,
      employeeDetailsId: EMPLOYEE_ID,
      contractId: CONTRACT_ID,
      effectiveTerminationDate: new Date('2024-06-30'),
      terminationReason: 'RENUNCIA' as ContractTerminationReason,
      status: overrides.status ?? FinalSettlementStatus.CALCULATED,
      mode: FinalSettlementMode.AUTOMATIC,
      snapshotContractType: EmployeeContractType.INDEFINIDO,
      snapshotContractStartDate: new Date('2020-01-01'),
      snapshotAgreedEndDate: null,
      snapshotSalaryType: SalaryType.ORDINARIO,
      snapshotSalaryAmount: new Prisma.Decimal('2000000'),
      snapshotSmlvAmount: new Prisma.Decimal('1300000'),
      snapshotTransportSubsidyAmount: new Prisma.Decimal('162000'),
      snapshotFormulaVersion: 1,
      snapshotSmlvThreshold: new Prisma.Decimal('10'),
      snapshotVariableAvgMonthsCovered: 0,
      snapshotVariableAvgTotal: new Prisma.Decimal('0'),
      snapshotVariableAvgMonthly: new Prisma.Decimal('0'),
      grossDevengados: new Prisma.Decimal('5000000'),
      totalDeducciones: new Prisma.Decimal('0'),
      netAmount: new Prisma.Decimal('5000000'),
      snapshotNetNegativeAmount: new Prisma.Decimal('0'),
      manualJustification: null,
      manualReference: null,
      manualResponsible: null,
      acceptedWarnings: [],
      auditTrail: [],
      createdBy: 'user-test',
      calculatedBy: 'user-test',
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
    };
  }

  function buildMappedRecord(
    overrides: Partial<{ status: FinalSettlementStatus }>,
  ): FinalSettlementRecord {
    const raw = buildMockRow(overrides);
    return {
      ...raw,
      snapshotSalaryAmount: raw.snapshotSalaryAmount.toFixed(2),
      snapshotSmlvAmount: raw.snapshotSmlvAmount.toFixed(2),
      snapshotTransportSubsidyAmount: raw.snapshotTransportSubsidyAmount.toFixed(2),
      snapshotSmlvThreshold: raw.snapshotSmlvThreshold.toFixed(2),
      snapshotVariableAvgTotal: raw.snapshotVariableAvgTotal.toFixed(2),
      snapshotVariableAvgMonthly: raw.snapshotVariableAvgMonthly.toFixed(2),
      grossDevengados: raw.grossDevengados.toFixed(2),
      totalDeducciones: raw.totalDeducciones.toFixed(2),
      netAmount: raw.netAmount.toFixed(2),
      snapshotNetNegativeAmount: raw.snapshotNetNegativeAmount.toFixed(2),
      terminationReason: raw.terminationReason,
      lines: [],
    };
  }
});
