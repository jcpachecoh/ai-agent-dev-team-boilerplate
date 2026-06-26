import { Test, TestingModule } from '@nestjs/testing';
import { SupplierResolver } from '../resolver/supplier.resolver';
import { SupplierService } from '../service/supplier.service';
import { PUB_SUB } from '../../pubsub/pubsub.module';

const tenantId = 'tenant-1';
const mockSupplier = {
  id: 'sup-1',
  tenantId,
  razonSocial: 'Test Supplier',
  nit: '123456789',
  tipo: 'PERSONA_JURIDICA',
  departamento: null,
  ciudad: null,
  condicionPago: 'CONTADO',
  cupoCredito: 0,
  calificacion: 3,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const serviceMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  search: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('SupplierResolver', () => {
  let resolver: SupplierResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierResolver,
        { provide: SupplierService, useValue: serviceMock },
        {
          provide: PUB_SUB,
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
            asyncIterator: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<SupplierResolver>(SupplierResolver);
    jest.clearAllMocks();
  });

  it('delegates suppliers to the service', async () => {
    serviceMock.findAll.mockResolvedValue([mockSupplier]);

    const result = await resolver.suppliers(
      { req: { headers: { 'x-tenant-id': tenantId } } } as never,
      'test',
      true,
      'CONTADO',
      10,
      0,
    );

    expect(result).toEqual([mockSupplier]);
    expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId, {
      filter: 'test',
      isActive: true,
      condicionPago: 'CONTADO',
      limit: 10,
      offset: 0,
    });
  });

  it('returns null when supplier is missing', async () => {
    serviceMock.findById.mockRejectedValue(new Error('missing'));

    await expect(
      resolver.supplier({ req: { headers: { 'x-tenant-id': tenantId } } } as never, 'missing'),
    ).resolves.toBeNull();
  });

  it('delegates createSupplier and publishes event', async () => {
    serviceMock.create.mockResolvedValue(mockSupplier);

    const publish = jest.fn().mockResolvedValue(undefined);
    const resolverWithPubSub = new SupplierResolver(
      serviceMock as never,
      {
        publish,
        asyncIterator: jest.fn(),
      } as never,
    );

    const result = await resolverWithPubSub.createSupplier(
      {
        req: { headers: { 'x-tenant-id': tenantId } },
      } as never,
      {
        razonSocial: 'Test Supplier',
        nit: '123456789',
        tipo: 'PERSONA_JURIDICA',
        condicionPago: 'CONTADO',
      },
    );

    expect(result).toEqual(mockSupplier);
    expect(publish).toHaveBeenCalledWith('supplierCreated', { supplierCreated: mockSupplier });
  });
});
