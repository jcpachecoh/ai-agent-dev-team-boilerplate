import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UserLocationsRepository } from '../repository/user-locations.repository';

const prismaMock = {
  userLocation: {
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  location: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('UserLocationsRepository', () => {
  let repository: UserLocationsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserLocationsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<UserLocationsRepository>(UserLocationsRepository);
    jest.clearAllMocks();
  });

  it('findUserForTenant filters by tenantId and deletedAt null', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await repository.findUserForTenant('tenant-1', 'user-1');

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-1', tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('findLocationForTenant filters by tenantId and deletedAt null', async () => {
    prismaMock.location.findFirst.mockResolvedValue(null);

    await repository.findLocationForTenant('tenant-1', 'loc-1');

    expect(prismaMock.location.findFirst).toHaveBeenCalledWith({
      where: { id: 'loc-1', tenantId: 'tenant-1', deletedAt: null },
    });
  });

  it('createAssignment persists with tenantId', async () => {
    prismaMock.userLocation.create.mockResolvedValue({ id: 'ul-1' });

    await repository.createAssignment('tenant-1', 'user-1', 'loc-1');

    expect(prismaMock.userLocation.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', userId: 'user-1', locationId: 'loc-1' },
    });
  });

  it('deleteAssignment filters by tenant, user and location', async () => {
    prismaMock.userLocation.deleteMany.mockResolvedValue({ count: 1 });

    await repository.deleteAssignment('tenant-1', 'user-1', 'loc-1');

    expect(prismaMock.userLocation.deleteMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: 'user-1', locationId: 'loc-1' },
    });
  });

  it('findUsersByLocation with activeOnly true filters isActive', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    await repository.findUsersByLocation('tenant-1', 'loc-1', true);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        isActive: true,
        userLocations: { some: { locationId: 'loc-1', tenantId: 'tenant-1' } },
      },
      orderBy: { email: 'asc' },
    });
  });

  it('findLocationsByUser excludes deleted locations', async () => {
    prismaMock.location.findMany.mockResolvedValue([]);

    await repository.findLocationsByUser('tenant-1', 'user-1');

    expect(prismaMock.location.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        users: { some: { userId: 'user-1', tenantId: 'tenant-1' } },
      },
      orderBy: { name: 'asc' },
    });
  });
});
