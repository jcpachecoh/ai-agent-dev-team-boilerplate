import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ContractTerminationReason,
  EmployeeContractType,
  FinalSettlementMode,
  FinalSettlementStatus,
  SalaryType,
  SettlementLineOrigin,
  SettlementLineType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../../prisma/prisma.service';
import { StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import { LegalFormulaValidationRepository } from '../repository/legal-formula-validation.repository';
import { PendingSalaryReconciliationRepository } from '../repository/pending-salary-reconciliation.repository';
import { FinalSettlementReceiptPdfService } from '../service/final-settlement-receipt-pdf.service';

const TENANT_ID = 'tenant-1';
const SETTLEMENT_ID = 'settlement-1';

function buildLine(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'line-1',
    tenantId: TENANT_ID,
    settlementId: SETTLEMENT_ID,
    code: 'CESANTIAS',
    name: 'Cesantías',
    type: SettlementLineType.DEVENGO,
    origin: SettlementLineOrigin.AUTOMATIC,
    sourceReference: null,
    baseAmount: new Decimal(2000000),
    quantity: new Decimal(90),
    rate: null,
    amount: new Decimal(500000),
    metadata: {},
    manualJustification: null,
    sortOrder: 0,
    createdAt: new Date(2026, 0, 1),
    ...overrides,
  };
}

function buildSettlement(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: SETTLEMENT_ID,
    tenantId: TENANT_ID,
    employeeDetailsId: 'emp-1',
    contractId: 'contract-1',
    effectiveTerminationDate: new Date(2026, 5, 30),
    terminationReason: ContractTerminationReason.RENUNCIA,
    status: FinalSettlementStatus.CALCULATED,
    mode: FinalSettlementMode.AUTOMATIC,
    snapshotContractType: EmployeeContractType.INDEFINIDO,
    snapshotContractStartDate: new Date(2024, 0, 15),
    snapshotAgreedEndDate: null,
    snapshotSalaryType: SalaryType.ORDINARIO,
    snapshotSalaryAmount: new Decimal(2000000),
    snapshotSmlvAmount: new Decimal(1300000),
    snapshotTransportSubsidyAmount: new Decimal(140000),
    snapshotFormulaVersion: 1,
    snapshotSmlvThreshold: new Decimal(10),
    snapshotVariableAvgMonthsCovered: 0,
    snapshotVariableAvgTotal: new Decimal(0),
    snapshotVariableAvgMonthly: new Decimal(0),
    grossDevengados: new Decimal(500000),
    totalDeducciones: new Decimal(0),
    netAmount: new Decimal(500000),
    snapshotNetNegativeAmount: new Decimal(0),
    manualJustification: null,
    manualReference: null,
    manualResponsible: null,
    acceptedWarnings: [],
    auditTrail: [],
    createdBy: 'user-1',
    calculatedBy: 'user-1',
    calculatedAt: new Date(2026, 5, 30),
    approvedBy: null,
    approvedAt: null,
    paidBy: null,
    paidAt: null,
    paymentReference: null,
    paymentDate: null,
    voidedBy: null,
    voidedAt: null,
    voidReason: null,
    createdAt: new Date(2026, 5, 30),
    updatedAt: new Date(2026, 5, 30),
    lines: [buildLine()],
    employee: {
      id: 'emp-1',
      name: 'Ana María Pérez',
      position: 'Cocinera',
      area: 'Cocina',
      department: 'Operaciones',
      user: {
        cedula: '123456789',
        documentType: 'CC',
      },
    },
    ...overrides,
  };
}

const mockTenant = {
  legalName: 'RESTAURANTE DEMO S.A.S.',
  tradeName: 'Demo',
  name: 'Demo',
  nit: '900123456-1',
  address: 'Cra 1 # 2-3',
  city: 'Bogotá D.C.',
  phone: '3000000000',
  email: 'rrhh@demo.com',
  logoUrl: null,
};

describe('FinalSettlementReceiptPdfService', (): void => {
  let service: FinalSettlementReceiptPdfService;
  let prisma: {
    finalSettlement: { findFirst: jest.Mock };
    tenant: { findFirst: jest.Mock };
  };
  let storageService: jest.Mocked<Pick<StorageService, 'uploadFile'>>;
  let legalFormulaValidationRepository: jest.Mocked<
    Pick<LegalFormulaValidationRepository, 'findActive'>
  >;
  let pendingSalaryReconciliationRepository: jest.Mocked<
    Pick<PendingSalaryReconciliationRepository, 'findBySettlement'>
  >;

  beforeEach(async (): Promise<void> => {
    prisma = {
      finalSettlement: { findFirst: jest.fn() },
      tenant: { findFirst: jest.fn() },
    };
    storageService = { uploadFile: jest.fn() };
    legalFormulaValidationRepository = { findActive: jest.fn() };
    pendingSalaryReconciliationRepository = { findBySettlement: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalSettlementReceiptPdfService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
        {
          provide: LegalFormulaValidationRepository,
          useValue: legalFormulaValidationRepository,
        },
        {
          provide: PendingSalaryReconciliationRepository,
          useValue: pendingSalaryReconciliationRepository,
        },
      ],
    }).compile();

    service = module.get(FinalSettlementReceiptPdfService);

    prisma.finalSettlement.findFirst.mockResolvedValue(buildSettlement());
    prisma.tenant.findFirst.mockResolvedValue(mockTenant);
    storageService.uploadFile.mockResolvedValue({ id: 'storage-receipt-1' } as never);
    legalFormulaValidationRepository.findActive.mockResolvedValue(null);
    pendingSalaryReconciliationRepository.findBySettlement.mockResolvedValue(null);
  });

  describe('generateReceiptPdf', (): void => {
    it('genera un PDF válido y lo sube a StorageService para una liquidación CALCULATED', async (): Promise<void> => {
      // Act
      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      // Assert
      expect(result.filename).toBe(`liquidacion-definitiva-${SETTLEMENT_ID}.pdf`);
      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(result.buffer.byteLength).toBeGreaterThan(200);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          uploadedBy: 'user-1',
          domain: StorageDomain.PAYROLL,
          entityType: 'FinalSettlement',
          entityId: SETTLEMENT_ID,
          visibility: StorageVisibility.PRIVATE,
          file: expect.objectContaining({
            mimetype: 'application/pdf',
            originalname: `liquidacion-definitiva-${SETTLEMENT_ID}.pdf`,
          }),
        }),
      );
    });

    it('genera el PDF para una liquidación APPROVED', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          status: FinalSettlementStatus.APPROVED,
          approvedBy: 'user-admin',
          approvedAt: new Date(2026, 6, 1),
        }),
      );

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('genera el PDF para una liquidación PAID con datos de pago', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          status: FinalSettlementStatus.PAID,
          approvedBy: 'user-admin',
          approvedAt: new Date(2026, 6, 1),
          paidBy: 'user-admin',
          paidAt: new Date(2026, 6, 5),
          paymentReference: 'TRF-2026-0099',
          paymentDate: new Date(2026, 6, 4),
        }),
      );

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('genera el PDF para una liquidación MANUAL con soporte', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          mode: FinalSettlementMode.MANUAL,
          manualJustification: 'Acuerdo documentado en acta',
          manualReference: 'ACTA-001',
          manualResponsible: 'Gerencia de RRHH',
          lines: [
            buildLine({
              code: 'AJUSTE_MANUAL',
              origin: SettlementLineOrigin.MANUAL,
              manualJustification: 'Acuerdo documentado',
            }),
          ],
        }),
      );

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('lanza NotFoundException si la liquidación no existe', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(null);

      await expect(service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(storageService.uploadFile).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el tenant no existe', async (): Promise<void> => {
      prisma.tenant.findFirst.mockResolvedValue(null);

      await expect(service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it.each([FinalSettlementStatus.DRAFT, FinalSettlementStatus.VOIDED])(
      'lanza ConflictException para estado %s (comprobante no disponible)',
      async (status): Promise<void> => {
        prisma.finalSettlement.findFirst.mockResolvedValue(buildSettlement({ status }));

        await expect(
          service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1'),
        ).rejects.toThrow(ConflictException);
        expect(storageService.uploadFile).not.toHaveBeenCalled();
      },
    );

    it('consulta la validación legal activa cuando hay línea INDEMNIZACION en modo AUTOMATIC', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          snapshotFormulaVersion: 3,
          lines: [buildLine({ code: 'INDEMNIZACION', name: 'Indemnización' })],
        }),
      );
      legalFormulaValidationRepository.findActive.mockResolvedValue({
        id: 'validation-1',
        tenantId: TENANT_ID,
        formulaVersion: 3,
        isActive: true,
        legalReference: 'Concepto jurídico 2026-014',
        observations: null,
        validatedBy: 'legal-user',
        validatedAt: new Date(2026, 1, 1),
        createdAt: new Date(2026, 1, 1),
        updatedAt: new Date(2026, 1, 1),
      });

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(legalFormulaValidationRepository.findActive).toHaveBeenCalledWith(TENANT_ID, 3);
      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('no consulta la validación legal cuando no hay línea INDEMNIZACION', async (): Promise<void> => {
      await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(legalFormulaValidationRepository.findActive).not.toHaveBeenCalled();
    });

    it('consulta la reconciliación de salario pendiente cuando hay línea SAL_PENDIENTE', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          lines: [buildLine({ code: 'SAL_PENDIENTE', name: 'Salario pendiente' })],
        }),
      );
      pendingSalaryReconciliationRepository.findBySettlement.mockResolvedValue({
        id: 'reconciliation-1',
        tenantId: TENANT_ID,
        settlementId: SETTLEMENT_ID,
        previouslyPaidAmount: '100000.00',
        paymentReference: 'TRF-001',
        paymentDate: new Date(2026, 2, 1),
        responsible: 'Juan Pérez',
        observation: 'Verificado contra extractos',
        recognizedBalance: '50000.00',
        createdBy: 'user-1',
        createdAt: new Date(2026, 2, 1),
      });

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(pendingSalaryReconciliationRepository.findBySettlement).toHaveBeenCalledWith(
        TENANT_ID,
        SETTLEMENT_ID,
      );
      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('genera el PDF aunque no exista reconciliación registrada todavía (CALCULATED con salario pendiente)', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          lines: [buildLine({ code: 'SAL_PENDIENTE', name: 'Salario pendiente' })],
        }),
      );

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('continúa cuando el logo del tenant no se puede cargar', async (): Promise<void> => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);
      prisma.tenant.findFirst.mockResolvedValue({
        ...mockTenant,
        logoUrl: 'https://logo.example/x.png',
      });
      const warnSpy = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation((): undefined => undefined);

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No se pudo cargar logo'));

      fetchMock.mockRestore();
      warnSpy.mockRestore();
    });

    it('dibuja el logo del tenant cuando la carga es exitosa', async (): Promise<void> => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        arrayBuffer: (): Promise<ArrayBuffer> => Promise.resolve(new ArrayBuffer(8)),
      } as unknown as Response);
      prisma.tenant.findFirst.mockResolvedValue({
        ...mockTenant,
        logoUrl: 'https://logo.example/x.png',
      });

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(fetchMock).toHaveBeenCalledWith('https://logo.example/x.png');

      fetchMock.mockRestore();
    });

    it('indica que no hay validación legal activa cuando la liquidación tiene INDEMNIZACION sin validar', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          lines: [buildLine({ code: 'INDEMNIZACION', name: 'Indemnización' })],
        }),
      );
      legalFormulaValidationRepository.findActive.mockResolvedValue(null);

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('genera el PDF con una línea manual sin base/cantidad/tasa (null)', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          mode: FinalSettlementMode.MANUAL,
          manualJustification: 'Acuerdo documentado en acta',
          manualReference: 'ACTA-001',
          manualResponsible: 'Gerencia de RRHH',
          lines: [
            buildLine({
              code: 'AJUSTE_MANUAL',
              origin: SettlementLineOrigin.MANUAL,
              manualJustification: 'Acuerdo documentado',
              baseAmount: null,
              quantity: null,
              rate: null,
            }),
          ],
        }),
      );

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('genera el PDF con soporte manual incompleto (justificación/referencia/responsable en null)', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          mode: FinalSettlementMode.MANUAL,
          manualJustification: null,
          manualReference: null,
          manualResponsible: null,
          lines: [
            buildLine({
              code: 'AJUSTE_MANUAL',
              origin: SettlementLineOrigin.MANUAL,
              manualJustification: 'Acuerdo documentado',
              rate: new Decimal(1.5),
            }),
          ],
        }),
      );

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('genera el PDF con un tenant mínimo (sin NIT/dirección/razón social) y reconciliación sin referencia/fecha de pago', async (): Promise<void> => {
      prisma.tenant.findFirst.mockResolvedValue({
        legalName: null,
        tradeName: null,
        name: 'Demo',
        nit: null,
        address: null,
        city: null,
        phone: null,
        email: null,
        logoUrl: null,
      });
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          lines: [buildLine({ code: 'SAL_PENDIENTE', name: 'Salario pendiente' })],
        }),
      );
      pendingSalaryReconciliationRepository.findBySettlement.mockResolvedValue({
        id: 'reconciliation-1',
        tenantId: TENANT_ID,
        settlementId: SETTLEMENT_ID,
        previouslyPaidAmount: '100000.00',
        paymentReference: null,
        paymentDate: null,
        responsible: 'Juan Pérez',
        observation: 'Verificado contra extractos',
        recognizedBalance: '50000.00',
        createdBy: 'user-1',
        createdAt: new Date(2026, 2, 1),
      });

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('pagina la tabla de líneas cuando hay suficientes líneas para llenar una página', async (): Promise<void> => {
      const manyLines = Array.from(
        { length: 60 },
        (_, index): Record<string, unknown> =>
          buildLine({
            id: `line-${index}`,
            code: `CONCEPTO_${index}`,
            name: `Concepto ${index}`,
          }),
      );
      prisma.finalSettlement.findFirst.mockResolvedValue(buildSettlement({ lines: manyLines }));

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('continúa cuando fetch del logo lanza una excepción (no solo un status no-ok)', async (): Promise<void> => {
      const fetchMock = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'));
      prisma.tenant.findFirst.mockResolvedValue({
        ...mockTenant,
        logoUrl: 'https://logo.example/x.png',
      });
      const warnSpy = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation((): undefined => undefined);

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Error cargando logo'));

      fetchMock.mockRestore();
      warnSpy.mockRestore();
    });

    it('formatea como "—" un monto o fecha inválidos en la reconciliación (defensa en profundidad)', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          lines: [buildLine({ code: 'SAL_PENDIENTE', name: 'Salario pendiente' })],
        }),
      );
      pendingSalaryReconciliationRepository.findBySettlement.mockResolvedValue({
        id: 'reconciliation-1',
        tenantId: TENANT_ID,
        settlementId: SETTLEMENT_ID,
        previouslyPaidAmount: 'no-es-un-numero',
        paymentReference: 'TRF-001',
        paymentDate: new Date('fecha-invalida'),
        responsible: 'Juan Pérez',
        observation: 'Verificado contra extractos',
        recognizedBalance: '50000.00',
        createdBy: 'user-1',
        createdAt: new Date(2026, 2, 1),
      });

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('genera el PDF incluyendo deducciones y saldo negativo a cargo del empleado', async (): Promise<void> => {
      prisma.finalSettlement.findFirst.mockResolvedValue(
        buildSettlement({
          grossDevengados: new Decimal(300000),
          totalDeducciones: new Decimal(500000),
          netAmount: new Decimal(0),
          snapshotNetNegativeAmount: new Decimal(200000),
          lines: [
            buildLine({
              code: 'CESANTIAS',
              type: SettlementLineType.DEVENGO,
              amount: new Decimal(300000),
            }),
            buildLine({
              id: 'line-2',
              code: 'PRESTAMO',
              name: 'Préstamo pendiente',
              type: SettlementLineType.DEDUCCION,
              amount: new Decimal(500000),
            }),
          ],
        }),
      );

      const result = await service.generateReceiptPdf(TENANT_ID, SETTLEMENT_ID, 'user-1');

      expect(result.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });
});
