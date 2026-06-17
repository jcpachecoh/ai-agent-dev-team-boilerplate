import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LocationsRepository } from '../repository/locations.repository';
import { LocationsService } from '../service/locations.service';

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

const repositoryMock = {
  findMany: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  toggleStatus: jest.fn(),
};

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationsService, { provide: LocationsRepository, useValue: repositoryMock }],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    jest.clearAllMocks();
  });

  it('assertTenantAccess throws ForbiddenException on mismatch', () => {
    expect(() => service.assertTenantAccess('tenant-a', 'tenant-b')).toThrow(ForbiddenException);
  });

  it('assertTenantAccess passes on match', () => {
    expect(() => service.assertTenantAccess('tenant-a', 'tenant-a')).not.toThrow();
  });

  it('findAll returns hasNextPage false when no extra row', async () => {
    repositoryMock.findMany.mockResolvedValue([baseLocation]);

    await expect(service.findAll('tenant-1', undefined, 20)).resolves.toEqual({
      items: [baseLocation],
      hasNextPage: false,
      endCursor: 'loc-1',
    });
  });

  it('findAll returns hasNextPage true when take+1 rows returned', async () => {
    const rows = Array.from({ length: 21 }, (_, index) => ({
      ...baseLocation,
      id: `loc-${index + 1}`,
    }));
    repositoryMock.findMany.mockResolvedValue(rows);

    const result = await service.findAll('tenant-1', undefined, 20);

    expect(result.hasNextPage).toBe(true);
    expect(result.items).toHaveLength(20);
    expect(result.endCursor).toBe('loc-20');
  });

  it('findOne throws NotFoundException when missing', async () => {
    repositoryMock.findById.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('create throws BadRequestException when address is missing', async () => {
    await expect(service.create('tenant-1', { name: 'Sede', address: '   ' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('create returns location on happy path', async () => {
    repositoryMock.create.mockResolvedValue(baseLocation);

    await expect(
      service.create('tenant-1', { name: 'Sede Principal', address: 'Calle 1' }),
    ).resolves.toEqual(baseLocation);
  });

  it('update throws NotFoundException when missing', async () => {
    repositoryMock.findById.mockResolvedValue(null);

    await expect(service.update('tenant-1', 'missing', { name: 'Nuevo' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('delete throws NotFoundException when missing', async () => {
    repositoryMock.findById.mockResolvedValue(null);

    await expect(service.delete('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('delete returns true and calls softDelete on happy path', async () => {
    repositoryMock.findById.mockResolvedValue(baseLocation);
    repositoryMock.softDelete.mockResolvedValue(undefined);

    await expect(service.delete('tenant-1', 'loc-1')).resolves.toBe(true);
    expect(repositoryMock.softDelete).toHaveBeenCalledWith('tenant-1', 'loc-1');
  });

  it('toggleStatus throws NotFoundException when missing', async () => {
    repositoryMock.findById.mockResolvedValue(null);

    await expect(service.toggleStatus('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('toggleStatus returns location with inverted isActive', async () => {
    repositoryMock.findById.mockResolvedValue(baseLocation);
    repositoryMock.toggleStatus.mockResolvedValue({ ...baseLocation, isActive: false });

    await expect(service.toggleStatus('tenant-1', 'loc-1')).resolves.toEqual({
      ...baseLocation,
      isActive: false,
    });
  });
});
