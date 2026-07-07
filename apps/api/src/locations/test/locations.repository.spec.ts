import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { LocationsRepository } from '../repository/locations.repository';

const prismaMock = {
  location: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const baseLocation = {
  id: 'loc-1',
  tenantId: 'tenant-1',
  name: 'Sede Principal',
  address: 'Calle 1',
  city: 'Bogotá',
  phone: null,
  code: 'PL-01',
  latitude: null,
  longitude: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('LocationsRepository', () => {
  let repository: LocationsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<LocationsRepository>(LocationsRepository);
    jest.clearAllMocks();
  });

  it('findMany filters by tenantId and deletedAt null', async () => {
    prismaMock.location.findMany.mockResolvedValue([]);

    await repository.findMany('tenant-1');

    expect(prismaMock.location.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null },
      take: 21,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findMany uses take + 1 for cursor pagination', async () => {
    prismaMock.location.findMany.mockResolvedValue([]);

    await repository.findMany('tenant-1', undefined, 10);

    expect(prismaMock.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 11 }),
    );
  });

  it('findMany with cursor includes skip 1', async () => {
    prismaMock.location.findMany.mockResolvedValue([]);

    await repository.findMany('tenant-1', 'cursor-1', 20);

    expect(prismaMock.location.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: 'cursor-1' },
        skip: 1,
      }),
    );
  });

  it('findById filters by tenantId and deletedAt null', async () => {
    prismaMock.location.findFirst.mockResolvedValue(null);

    await repository.findById('tenant-1', 'loc-1');

    expect(prismaMock.location.findFirst).toHaveBeenCalledWith({
      where: { id: 'loc-1', tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('create persists location for tenant', async () => {
    prismaMock.location.create.mockResolvedValue(baseLocation);

    await repository.create('tenant-1', {
      name: 'Sede Principal',
      address: 'Calle 1',
      city: 'Bogotá',
    });

    expect(prismaMock.location.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        name: 'Sede Principal',
        address: 'Calle 1',
        city: 'Bogotá',
        phone: undefined,
      }),
    });
  });

  it('softDelete sets deletedAt and does not call delete', async () => {
    prismaMock.location.update.mockResolvedValue(baseLocation);

    await repository.softDelete('tenant-1', 'loc-1');

    expect(prismaMock.location.update).toHaveBeenCalledWith({
      where: { id: 'loc-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('toggleStatus inverts isActive', async () => {
    prismaMock.location.findFirst.mockResolvedValue({ ...baseLocation, isActive: true });
    prismaMock.location.update.mockResolvedValue({ ...baseLocation, isActive: false });

    await repository.toggleStatus('tenant-1', 'loc-1');

    expect(prismaMock.location.update).toHaveBeenCalledWith({
      where: { id: 'loc-1' },
      data: { isActive: false },
    });
  });
});
