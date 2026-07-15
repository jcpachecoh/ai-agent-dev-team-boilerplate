import { Test, type TestingModule } from '@nestjs/testing';
import {
  ContractTerminationReason,
  FinalSettlementMode,
  Prisma,
  SettlementLineType,
} from '@prisma/client';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { REQUIRED_PERMISSIONS_KEY } from '../../common/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { ManualSettlementDto } from '../controller/dto/manual-settlement.dto';
import { FinalSettlementController } from '../controller/final-settlement.controller';
import { FinalSettlementReceiptPdfService } from '../service/final-settlement-receipt-pdf.service';
import { FinalSettlementService } from '../service/final-settlement.service';
import { PendingSalaryReconciliationService } from '../service/pending-salary-reconciliation.service';

function makeJwtUser(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    sub: 'user-1',
    email: 'test@example.com',
    tenantId: 'tenant-1',
    roleId: 'role-1',
    roleCode: 'OWNER',
    ...overrides,
  };
}

interface MockFinalSettlementService {
  preview: jest.Mock;
  calculateAndSave: jest.Mock;
  createManual: jest.Mock;
  recalculate: jest.Mock;
  approve: jest.Mock;
  markPaid: jest.Mock;
  void: jest.Mock;
  findById: jest.Mock;
  findAllByEmployee: jest.Mock;
}

interface MockPendingSalaryReconciliationService {
  reconcile: jest.Mock;
  findBySettlement: jest.Mock;
}

interface MockFinalSettlementReceiptPdfService {
  generateReceiptPdf: jest.Mock;
}

describe('FinalSettlementController', (): void => {
  let controller: FinalSettlementController;
  let mockService: MockFinalSettlementService;
  let mockReconciliationService: MockPendingSalaryReconciliationService;
  let mockReceiptPdfService: MockFinalSettlementReceiptPdfService;
  const mockUser = makeJwtUser();
  const mockTenantId = 'tenant-1';

  beforeEach(async (): Promise<void> => {
    mockService = {
      preview: jest.fn(),
      calculateAndSave: jest.fn(),
      createManual: jest.fn(),
      recalculate: jest.fn(),
      approve: jest.fn(),
      markPaid: jest.fn(),
      void: jest.fn(),
      findById: jest.fn(),
      findAllByEmployee: jest.fn(),
    };
    mockReconciliationService = {
      reconcile: jest.fn(),
      findBySettlement: jest.fn(),
    };
    mockReceiptPdfService = {
      generateReceiptPdf: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinalSettlementController],
      providers: [
        { provide: FinalSettlementService, useValue: mockService },
        { provide: PendingSalaryReconciliationService, useValue: mockReconciliationService },
        { provide: FinalSettlementReceiptPdfService, useValue: mockReceiptPdfService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (): boolean => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: (): boolean => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: (): boolean => true })
      .compile();

    controller = module.get<FinalSettlementController>(FinalSettlementController);
  });

  it('preview delega al servicio con las fechas convertidas', async (): Promise<void> => {
    mockService.preview.mockResolvedValue({ lines: [], blocks: [] });

    await controller.preview(mockUser, mockTenantId, {
      employeeDetailsId: 'emp-1',
      effectiveTerminationDate: '2024-06-30',
      terminationReason: ContractTerminationReason.RENUNCIA,
    });

    expect(mockService.preview).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: mockTenantId,
        employeeDetailsId: 'emp-1',
        effectiveTerminationDate: new Date('2024-06-30'),
        terminationReason: ContractTerminationReason.RENUNCIA,
      }),
    );
  });

  it('calculate delega createdBy=user.sub', async (): Promise<void> => {
    mockService.calculateAndSave.mockResolvedValue({ id: 'settlement-1' });

    await controller.calculate(mockUser, mockTenantId, {
      employeeDetailsId: 'emp-1',
      effectiveTerminationDate: '2024-06-30',
      terminationReason: ContractTerminationReason.RENUNCIA,
      mode: FinalSettlementMode.AUTOMATIC,
    });

    expect(mockService.calculateAndSave).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: mockTenantId, createdBy: 'user-1' }),
    );
  });

  it('createManual convierte los montos de línea a Prisma.Decimal', async (): Promise<void> => {
    mockService.createManual.mockResolvedValue({ id: 'settlement-1' });
    const body: ManualSettlementDto = {
      employeeDetailsId: 'emp-1',
      effectiveTerminationDate: '2024-06-30',
      terminationReason: ContractTerminationReason.JUSTA_CAUSA,
      lines: [
        {
          code: 'AJUSTE',
          name: 'Ajuste',
          type: SettlementLineType.DEVENGO,
          amount: '1000000',
          manualJustification: 'Acuerdo',
        },
      ],
      manualJustification: 'Liquidación por acuerdo',
      manualReference: 'DOC-001',
      manualResponsible: 'Juan Pérez',
    };

    await controller.createManual(mockUser, mockTenantId, body);

    expect(mockService.createManual).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: [
          expect.objectContaining({
            code: 'AJUSTE',
            amount: expect.any(Prisma.Decimal),
          }),
        ],
      }),
    );
    type CreateManualCallData = { lines: Array<{ amount: Prisma.Decimal }> };
    const [callArgs] = mockService.createManual.mock.calls as CreateManualCallData[][];
    expect(callArgs[0].lines[0].amount.toString()).toBe('1000000');
  });

  it('approve delega tenantId/id/user.sub', async (): Promise<void> => {
    mockService.approve.mockResolvedValue({ id: 'settlement-1' });

    await controller.approve(mockUser, mockTenantId, 'settlement-1');

    expect(mockService.approve).toHaveBeenCalledWith(mockTenantId, 'settlement-1', 'user-1');
  });

  it('pay delega tenantId/id/user.sub + referencia/fecha de pago', async (): Promise<void> => {
    mockService.markPaid.mockResolvedValue({ id: 'settlement-1' });

    await controller.pay(mockUser, mockTenantId, 'settlement-1', {
      paymentReference: 'TRF-2026-0001',
      paymentDate: '2026-01-10',
    });

    expect(mockService.markPaid).toHaveBeenCalledWith(mockTenantId, 'settlement-1', {
      paidBy: 'user-1',
      paymentReference: 'TRF-2026-0001',
      paymentDate: new Date('2026-01-10'),
    });
  });

  it('voidSettlement delega voidReason', async (): Promise<void> => {
    mockService.void.mockResolvedValue({ id: 'settlement-1' });

    await controller.voidSettlement(mockUser, mockTenantId, 'settlement-1', {
      voidReason: 'Error de datos',
    });

    expect(mockService.void).toHaveBeenCalledWith(
      mockTenantId,
      'settlement-1',
      'Error de datos',
      'user-1',
    );
  });

  it('reconcilePendingSalary delega al servicio de reconciliación', async (): Promise<void> => {
    mockReconciliationService.reconcile.mockResolvedValue({ id: 'reconciliation-1' });

    await controller.reconcilePendingSalary(mockUser, mockTenantId, 'settlement-1', {
      previouslyPaidAmount: '0.00',
      responsible: 'Juan Pérez',
      observation: 'Verificado',
      recognizedBalance: '100000.00',
    });

    expect(mockReconciliationService.reconcile).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: mockTenantId,
        settlementId: 'settlement-1',
        createdBy: 'user-1',
      }),
    );
  });

  it('downloadReceipt delega tenantId/id/user.sub y envía el PDF con Content-Disposition', async (): Promise<void> => {
    const buffer = Buffer.from('%PDF-1.4 fake');
    mockReceiptPdfService.generateReceiptPdf.mockResolvedValue({
      buffer,
      filename: 'liquidacion-definitiva-settlement-1.pdf',
    });
    const mockSetHeader = jest.fn();
    const mockSend = jest.fn();
    const res = {
      setHeader: mockSetHeader,
      send: mockSend,
    } as unknown as import('express').Response;

    await controller.downloadReceipt(mockUser, mockTenantId, 'settlement-1', res);

    expect(mockReceiptPdfService.generateReceiptPdf).toHaveBeenCalledWith(
      mockTenantId,
      'settlement-1',
      'user-1',
    );
    expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(mockSetHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="liquidacion-definitiva-settlement-1.pdf"',
    );
    expect(mockSend).toHaveBeenCalledWith(buffer);
  });

  // ── Separación de permisos (§15.6) — cada acción tiene su propio código ────

  describe('permisos granulares (@RequirePermission)', (): void => {
    // Indexar el prototipo a través de un tipo function-record (no `any`) evita tanto
    // no-unsafe-* como @typescript-eslint/unbound-method — Reflect.getMetadata solo lee
    // metadata de la función, nunca la invoca, así que perder el `this` no aplica aquí.
    const controllerProto = FinalSettlementController.prototype as unknown as Record<
      string,
      (...args: unknown[]) => unknown
    >;

    function permissionsOf(methodName: string): string[] | undefined {
      return Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, controllerProto[methodName]) as
        | string[]
        | undefined;
    }

    it.each([
      ['preview', 'nomina.settlement.calculate'],
      ['calculate', 'nomina.settlement.calculate'],
      ['createManual', 'nomina.settlement.manual'],
      ['recalculate', 'nomina.settlement.calculate'],
      ['approve', 'nomina.settlement.approve'],
      ['pay', 'nomina.settlement.pay'],
      ['voidSettlement', 'nomina.settlement.void'],
      ['reconcilePendingSalary', 'nomina.settlement.reconcile_pending_salary'],
      ['getPendingSalaryReconciliation', 'nomina.settlement.read'],
      ['listByEmployee', 'nomina.settlement.read'],
      ['detail', 'nomina.settlement.read'],
      ['downloadReceipt', 'nomina.settlement.read'],
    ])('%s requiere el permiso %s', (methodName, expectedPermission): void => {
      expect(permissionsOf(methodName)).toEqual([expectedPermission]);
    });

    it('approve y pay usan permisos DISTINTOS entre sí (separación de funciones)', (): void => {
      expect(permissionsOf('approve')).not.toEqual(permissionsOf('pay'));
    });
  });
});
