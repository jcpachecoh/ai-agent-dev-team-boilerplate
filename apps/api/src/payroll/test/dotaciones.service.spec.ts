import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DotacionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { DotacionesRepository } from '../repository/dotaciones.repository';
import { DotacionesService } from '../service/dotaciones.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { SMLV_2025 } from '../payroll.constants';

const THRESHOLD = SMLV_2025 * 2;

const tenantId = 'tenant-1';
const employeeId = 'emp-1';
const deliveryId = 'delivery-1';
const supplyItemId = 'supply-1';

function makeDelivery(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: deliveryId,
    tenantId,
    employeeId,
    period: '2026-04',
    supplyItemId: null,
    quantity: 1,
    deliveredAt: null,
    status: DotacionStatus.PENDIENTE,
    signedReceiptUrl: null,
    stockMovementId: null,
    noAplicaReason: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    supplyItem: null,
    ...overrides,
  };
}

function makeSupplyItem(stock: number, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: supplyItemId,
    nombre: 'Zapatos de seguridad',
    stockActualBodega: new Decimal(stock),
    talla: '42',
    ...overrides,
  };
}

describe('DotacionesService', () => {
  let service: DotacionesService;
  let repo: jest.Mocked<DotacionesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DotacionesService,
        {
          provide: DotacionesRepository,
          useValue: {
            findEligibleEmployees: jest.fn(),
            findExistingDeliveries: jest.fn(),
            createManyDeliveries: jest.fn(),
            findById: jest.fn(),
            findByPeriod: jest.fn(),
            findEmployeeHistory: jest.fn(),
            findAvailableSupplyItems: jest.fn(),
            findSupplyItemForDelivery: jest.fn(),
            registerDeliveryTransaction: jest.fn(),
            markNotApplicable: jest.fn(),
            findComplianceReport: jest.fn(),
          },
        },
        {
          provide: LaborLegalParametersService,
          useValue: {
            // Reproduces the pre-OS-585 hardcoded SMLV_2025 constant so the
            // 2×SMLV dotación eligibility threshold assertion keeps passing unchanged.
            getValueAt: jest.fn().mockResolvedValue(SMLV_2025),
          },
        },
      ],
    }).compile();

    service = module.get<DotacionesService>(DotacionesService);
    repo = module.get(DotacionesRepository);
  });

  // ── generatePeriodEntitlements ─────────────────────────────────────────────

  describe('generatePeriodEntitlements', () => {
    const period = '2026-04';

    it('crea registros PENDIENTE para empleados elegibles', async () => {
      // Arrange
      repo.findEligibleEmployees.mockResolvedValue([
        {
          id: 'emp-1',
          name: 'Ana',
          salaryAmount: new Decimal(1000000),
          hireDate: new Date('2025-01-01'),
          locationId: 'loc-1',
        },
        {
          id: 'emp-2',
          name: 'Luis',
          salaryAmount: new Decimal(1500000),
          hireDate: new Date('2025-01-01'),
          locationId: 'loc-1',
        },
      ]);
      repo.findExistingDeliveries.mockResolvedValue([]);
      repo.createManyDeliveries.mockResolvedValue({ count: 2 });

      // Act
      const result = await service.generatePeriodEntitlements(tenantId, period);

      // Assert
      expect(result).toEqual({ processed: 2, created: 2, skipped: 0 });
      expect(repo.createManyDeliveries).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ status: DotacionStatus.PENDIENTE, period }),
        ]),
      );
    });

    it('es idempotente — omite empleados que ya tienen registro en el período', async () => {
      // Arrange
      repo.findEligibleEmployees.mockResolvedValue([
        {
          id: 'emp-1',
          name: 'Ana',
          salaryAmount: new Decimal(1000000),
          hireDate: new Date(),
          locationId: 'loc-1',
        },
        {
          id: 'emp-2',
          name: 'Luis',
          salaryAmount: new Decimal(1200000),
          hireDate: new Date(),
          locationId: 'loc-1',
        },
      ]);
      repo.findExistingDeliveries.mockResolvedValue([{ employeeId: 'emp-1' }]);
      repo.createManyDeliveries.mockResolvedValue({ count: 1 });

      // Act
      const result = await service.generatePeriodEntitlements(tenantId, period);

      // Assert
      expect(result).toEqual({ processed: 2, created: 1, skipped: 1 });
      const createCall = repo.createManyDeliveries.mock.calls[0]![0];
      expect(createCall).toHaveLength(1);
      expect(createCall[0]).toMatchObject({ employeeId: 'emp-2' });
    });

    it('retorna ceros si no hay empleados elegibles', async () => {
      // Arrange
      repo.findEligibleEmployees.mockResolvedValue([]);

      // Act
      const result = await service.generatePeriodEntitlements(tenantId, period);

      // Assert
      expect(result).toEqual({ processed: 0, created: 0, skipped: 0 });
      expect(repo.createManyDeliveries).not.toHaveBeenCalled();
    });

    it('rechaza período con formato inválido', async () => {
      await expect(service.generatePeriodEntitlements(tenantId, '2026-06')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.generatePeriodEntitlements(tenantId, 'abril')).rejects.toThrow(
        ConflictException,
      );
    });

    it('pasa el umbral salarial correcto (2 × SMLV) al repositorio', async () => {
      // Arrange
      repo.findEligibleEmployees.mockResolvedValue([]);

      // Act
      await service.generatePeriodEntitlements(tenantId, period);

      // Assert
      expect(repo.findEligibleEmployees).toHaveBeenCalledWith(tenantId, THRESHOLD);
    });
  });

  // ── registerDelivery ──────────────────────────────────────────────────────

  describe('registerDelivery', () => {
    const input = {
      dotacionDeliveryId: deliveryId,
      supplyItemId,
      quantity: 1,
      deliveredAt: new Date(),
    };

    it('happy path — registra entrega y descuenta stock', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery());
      repo.findSupplyItemForDelivery.mockResolvedValue(makeSupplyItem(5));
      const delivered = makeDelivery({ status: DotacionStatus.ENTREGADA, supplyItemId });
      repo.registerDeliveryTransaction.mockResolvedValue(delivered);

      // Act
      const result = await service.registerDelivery(input, tenantId);

      // Assert
      expect(repo.registerDeliveryTransaction).toHaveBeenCalledWith(
        deliveryId,
        supplyItemId,
        1,
        input.deliveredAt,
        undefined,
        5,
      );
      expect(result.status).toBe(DotacionStatus.ENTREGADA);
    });

    it('rechaza si stock < quantity', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery());
      repo.findSupplyItemForDelivery.mockResolvedValue(makeSupplyItem(0));

      // Act & Assert
      await expect(service.registerDelivery({ ...input, quantity: 2 }, tenantId)).rejects.toThrow(
        ConflictException,
      );
      expect(repo.registerDeliveryTransaction).not.toHaveBeenCalled();
    });

    it('rechaza si stock exactamente igual a 0', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery());
      repo.findSupplyItemForDelivery.mockResolvedValue(makeSupplyItem(0));

      // Act & Assert
      await expect(service.registerDelivery(input, tenantId)).rejects.toThrow(ConflictException);
    });

    it('permite entrega cuando stock = quantity (borde)', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery());
      repo.findSupplyItemForDelivery.mockResolvedValue(makeSupplyItem(2));
      repo.registerDeliveryTransaction.mockResolvedValue(
        makeDelivery({ status: DotacionStatus.ENTREGADA }),
      );

      // Act
      await service.registerDelivery({ ...input, quantity: 2 }, tenantId);

      // Assert
      expect(repo.registerDeliveryTransaction).toHaveBeenCalledWith(
        deliveryId,
        supplyItemId,
        2,
        expect.any(Date),
        undefined,
        2,
      );
    });

    it('rechaza si la dotación ya fue entregada', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery({ status: DotacionStatus.ENTREGADA }));

      // Act & Assert
      await expect(service.registerDelivery(input, tenantId)).rejects.toThrow(ConflictException);
    });

    it('rechaza si la dotación está marcada como NO_APLICA', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery({ status: DotacionStatus.NO_APLICA }));

      // Act & Assert
      await expect(service.registerDelivery(input, tenantId)).rejects.toThrow(ConflictException);
    });

    it('lanza NotFoundException si la dotación no existe', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.registerDelivery(input, tenantId)).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si el supply item no existe en el tenant', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery());
      repo.findSupplyItemForDelivery.mockResolvedValue(null);

      // Act & Assert
      await expect(service.registerDelivery(input, tenantId)).rejects.toThrow(NotFoundException);
    });

    it('pasa signedReceiptUrl al repositorio cuando se provee', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery());
      repo.findSupplyItemForDelivery.mockResolvedValue(makeSupplyItem(3));
      repo.registerDeliveryTransaction.mockResolvedValue(makeDelivery());
      const url = 'https://r2.example.com/recibo.pdf';

      // Act
      await service.registerDelivery({ ...input, signedReceiptUrl: url }, tenantId);

      // Assert
      expect(repo.registerDeliveryTransaction).toHaveBeenCalledWith(
        deliveryId,
        supplyItemId,
        1,
        expect.any(Date),
        url,
        3,
      );
    });
  });

  // ── markNotApplicable ─────────────────────────────────────────────────────

  describe('markNotApplicable', () => {
    it('marca como NO_APLICA una dotación PENDIENTE', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery());
      repo.markNotApplicable.mockResolvedValue(makeDelivery({ status: DotacionStatus.NO_APLICA }));

      // Act
      const result = await service.markNotApplicable({ id: deliveryId, tenantId });

      // Assert
      expect(repo.markNotApplicable).toHaveBeenCalledWith(deliveryId, tenantId, undefined);
      expect(result.status).toBe(DotacionStatus.NO_APLICA);
    });

    it('pasa la razón al repositorio', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery());
      repo.markNotApplicable.mockResolvedValue(makeDelivery({ status: DotacionStatus.NO_APLICA }));

      // Act
      await service.markNotApplicable({
        id: deliveryId,
        tenantId,
        reason: 'Empleado desvinculado',
      });

      // Assert
      expect(repo.markNotApplicable).toHaveBeenCalledWith(
        deliveryId,
        tenantId,
        'Empleado desvinculado',
      );
    });

    it('rechaza si la dotación no está PENDIENTE (ya ENTREGADA)', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery({ status: DotacionStatus.ENTREGADA }));

      // Act & Assert
      await expect(service.markNotApplicable({ id: deliveryId, tenantId })).rejects.toThrow(
        ConflictException,
      );
    });

    it('rechaza si la dotación ya es NO_APLICA', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery({ status: DotacionStatus.NO_APLICA }));

      // Act & Assert
      await expect(service.markNotApplicable({ id: deliveryId, tenantId })).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza NotFoundException si no existe', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.markNotApplicable({ id: 'no-existe', tenantId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('retorna la dotación si existe y pertenece al tenant', async () => {
      // Arrange
      repo.findById.mockResolvedValue(makeDelivery());

      // Act
      const result = await service.findById(deliveryId, tenantId);

      // Assert
      expect(result.id).toBe(deliveryId);
    });

    it('lanza NotFoundException si no existe (o tenant incorrecto)', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('otro', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  // ── getComplianceReport ───────────────────────────────────────────────────

  describe('getComplianceReport', () => {
    it('retorna filas del reporte para período válido', async () => {
      // Arrange
      repo.findComplianceReport.mockResolvedValue([]);

      // Act
      const result = await service.getComplianceReport(tenantId, '2026-08');

      // Assert
      expect(repo.findComplianceReport).toHaveBeenCalledWith(tenantId, '2026-08', undefined);
      expect(result).toEqual([]);
    });

    it('rechaza período con formato inválido', async () => {
      await expect(service.getComplianceReport(tenantId, '2026-06')).rejects.toThrow(
        ConflictException,
      );
    });

    it('filtra por locationId cuando se provee', async () => {
      // Arrange
      repo.findComplianceReport.mockResolvedValue([]);

      // Act
      await service.getComplianceReport(tenantId, '2026-12', 'loc-1');

      // Assert
      expect(repo.findComplianceReport).toHaveBeenCalledWith(tenantId, '2026-12', 'loc-1');
    });
  });

  // ── getAvailableSupplyItems ────────────────────────────────────────────────

  describe('getAvailableSupplyItems', () => {
    it('delega al repositorio con el tenantId correcto', async () => {
      // Arrange
      repo.findAvailableSupplyItems.mockResolvedValue([]);

      // Act
      await service.getAvailableSupplyItems(tenantId);

      // Assert
      expect(repo.findAvailableSupplyItems).toHaveBeenCalledWith(tenantId);
    });
  });
});
