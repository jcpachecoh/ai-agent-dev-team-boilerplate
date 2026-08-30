import { Test, TestingModule } from '@nestjs/testing';
import { DotacionStatus } from '@prisma/client';
import { DotacionesResolver } from '../resolver/dotaciones.resolver';
import { DotacionesService } from '../service/dotaciones.service';

const tenantId = 'tenant-1';
const mockCtx = { req: { headers: { 'x-tenant-id': tenantId } } };

function makeDelivery(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'delivery-1',
    tenantId,
    employeeId: 'emp-1',
    employeeName: 'Empleado Test',
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

const mockPage = {
  edges: [makeDelivery()],
  pageInfo: { hasNextPage: false, endCursor: null },
};

describe('DotacionesResolver', () => {
  let resolver: DotacionesResolver;
  let service: jest.Mocked<DotacionesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DotacionesResolver,
        {
          provide: DotacionesService,
          useValue: {
            generatePeriodEntitlements: jest.fn(),
            getAvailableSupplyItems: jest.fn(),
            findByPeriod: jest.fn(),
            findById: jest.fn(),
            findEmployeeHistory: jest.fn(),
            registerDelivery: jest.fn(),
            markNotApplicable: jest.fn(),
            getComplianceReport: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<DotacionesResolver>(DotacionesResolver);
    service = module.get(DotacionesService);
  });

  it('must be defined', () => {
    expect(resolver).toBeDefined();
  });

  // ── dotacionPeriod ─────────────────────────────────────────────────────────

  describe('dotacionPeriod', () => {
    it('delega al service con tenantId extraído del contexto', async () => {
      // Arrange
      service.findByPeriod.mockResolvedValue(mockPage);

      // Act
      const result = await resolver.dotacionPeriod(mockCtx, '2026-04', undefined, undefined, 20);

      // Assert
      expect(service.findByPeriod).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, period: '2026-04', take: 20 }),
      );
      expect(result.edges).toHaveLength(1);
    });

    it('filtra por sede cuando se provee locationId', async () => {
      // Arrange
      service.findByPeriod.mockResolvedValue(mockPage);

      // Act
      await resolver.dotacionPeriod(mockCtx, '2026-08', 'loc-1');

      // Assert
      expect(service.findByPeriod).toHaveBeenCalledWith(
        expect.objectContaining({ locationId: 'loc-1' }),
      );
    });
  });

  // ── availableItemsForDotacion ─────────────────────────────────────────────

  describe('availableItemsForDotacion', () => {
    it('retorna ítems disponibles con stock como string', async () => {
      // Arrange
      const { Decimal } = await import('@prisma/client/runtime/library');
      service.getAvailableSupplyItems.mockResolvedValue([
        {
          id: 'item-1',
          nombre: 'Zapatos',
          talla: '42',
          genero: null,
          subcategoria: null,
          stockActualBodega: new Decimal(5),
          unidadBase: 'UNIT' as const,
        },
      ]);

      // Act
      const result = await resolver.availableItemsForDotacion(mockCtx);

      // Assert
      expect(result[0]).toMatchObject({ id: 'item-1', stockActualBodega: '5' });
    });

    it('retorna array vacío si no hay ítems con stock', async () => {
      // Arrange
      service.getAvailableSupplyItems.mockResolvedValue([]);

      // Act
      const result = await resolver.availableItemsForDotacion(mockCtx);

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ── dotacionDelivery ──────────────────────────────────────────────────────

  describe('dotacionDelivery', () => {
    it('retorna el registro por id y tenant', async () => {
      // Arrange
      service.findById.mockResolvedValue(makeDelivery());

      // Act
      const result = await resolver.dotacionDelivery(mockCtx, 'delivery-1');

      // Assert
      expect(service.findById).toHaveBeenCalledWith('delivery-1', tenantId);
      expect(result.id).toBe('delivery-1');
    });
  });

  // ── employeeDotacionHistory ────────────────────────────────────────────────

  describe('employeeDotacionHistory', () => {
    it('delega con employeeId y tenantId', async () => {
      // Arrange
      service.findEmployeeHistory.mockResolvedValue(mockPage);

      // Act
      await resolver.employeeDotacionHistory(mockCtx, 'emp-1', undefined, 10);

      // Assert
      expect(service.findEmployeeHistory).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: 'emp-1', tenantId, take: 10 }),
      );
    });
  });

  // ── generatePeriodEntitlements ────────────────────────────────────────────

  describe('generatePeriodEntitlements', () => {
    it('retorna resultado de generación', async () => {
      // Arrange
      service.generatePeriodEntitlements.mockResolvedValue({
        processed: 5,
        created: 4,
        skipped: 1,
      });

      // Act
      const result = await resolver.generatePeriodEntitlements(mockCtx, '2026-04');

      // Assert
      expect(service.generatePeriodEntitlements).toHaveBeenCalledWith(tenantId, '2026-04');
      expect(result.processed).toBe(5);
    });
  });

  // ── registerDotacionDelivery ──────────────────────────────────────────────

  describe('registerDotacionDelivery', () => {
    const input = {
      dotacionDeliveryId: 'delivery-1',
      supplyItemId: 'supply-1',
      quantity: 1,
      deliveredAt: new Date(),
      signedReceiptUrl: undefined,
    };

    it('registra la entrega con tenantId del contexto', async () => {
      // Arrange
      service.registerDelivery.mockResolvedValue(
        makeDelivery({ status: DotacionStatus.ENTREGADA }),
      );

      // Act
      const result = await resolver.registerDotacionDelivery(mockCtx, input);

      // Assert
      expect(service.registerDelivery).toHaveBeenCalledWith(
        expect.objectContaining({ dotacionDeliveryId: 'delivery-1', quantity: 1 }),
        tenantId,
      );
      expect(result.status).toBe(DotacionStatus.ENTREGADA);
    });
  });

  // ── markDotacionNotApplicable ─────────────────────────────────────────────

  describe('markDotacionNotApplicable', () => {
    it('delega con id, tenantId y razón opcional', async () => {
      // Arrange
      service.markNotApplicable.mockResolvedValue(
        makeDelivery({ status: DotacionStatus.NO_APLICA }),
      );

      // Act
      await resolver.markDotacionNotApplicable(mockCtx, 'delivery-1', 'Empleado trasladado');

      // Assert
      expect(service.markNotApplicable).toHaveBeenCalledWith({
        id: 'delivery-1',
        tenantId,
        reason: 'Empleado trasladado',
      });
    });

    it('funciona sin razón', async () => {
      // Arrange
      service.markNotApplicable.mockResolvedValue(
        makeDelivery({ status: DotacionStatus.NO_APLICA }),
      );

      // Act
      await resolver.markDotacionNotApplicable(mockCtx, 'delivery-1');

      // Assert
      expect(service.markNotApplicable).toHaveBeenCalledWith({
        id: 'delivery-1',
        tenantId,
        reason: undefined,
      });
    });
  });
});
