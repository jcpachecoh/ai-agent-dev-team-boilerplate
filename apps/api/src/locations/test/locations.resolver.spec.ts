import { Test, TestingModule } from '@nestjs/testing';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { LocationsResolver } from '../resolver/locations.resolver';
import { LocationsService } from '../service/locations.service';
import type { CreateLocationInput } from '../resolver/dto/create-location.input';
import type { UpdateLocationInput } from '../resolver/dto/update-location.input';

const tenantId = 'palos-de-lena';

const jwtUser: JwtPayload = {
  sub: 'user-1',
  email: 'owner@test.dev',
  tenantId,
  roleId: 'role-1',
  roleCode: 'OWNER',
};

const baseLocation = {
  id: 'loc-1',
  tenantId,
  name: 'Sede Principal',
  address: 'Calle 1',
  city: 'Bogotá',
  phone: null,
  code: 'PL-01',
  latitude: null,
  longitude: null,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  deletedAt: null,
};

const serviceMock = {
  assertTenantAccess: jest.fn(),
  parseAndValidateBusinessHours: jest.fn().mockReturnValue(null),
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  toggleStatus: jest.fn(),
};

describe('LocationsResolver', () => {
  let resolver: LocationsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationsResolver, { provide: LocationsService, useValue: serviceMock }],
    }).compile();

    resolver = module.get<LocationsResolver>(LocationsResolver);
    jest.clearAllMocks();
  });

  it('locations calls assertTenantAccess and findAll', async () => {
    serviceMock.findAll.mockResolvedValue({
      items: [baseLocation],
      hasNextPage: false,
      endCursor: 'loc-1',
    });

    await resolver.locations(jwtUser, tenantId);

    expect(serviceMock.assertTenantAccess).toHaveBeenCalledWith(tenantId, tenantId);
    expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId, undefined, undefined);
  });

  it('locations maps LocationConnection correctly', async () => {
    serviceMock.findAll.mockResolvedValue({
      items: [baseLocation],
      hasNextPage: false,
      endCursor: 'loc-1',
    });

    const result = await resolver.locations(jwtUser, tenantId);

    expect(result.edges).toEqual([
      {
        node: expect.objectContaining({
          id: 'loc-1',
          restaurantId: tenantId,
          name: 'Sede Principal',
        }),
        cursor: 'loc-1',
      },
    ]);
    expect(result.pageInfo).toEqual({
      hasNextPage: false,
      endCursor: 'loc-1',
    });
  });

  it('location validates tenant and returns LocationType', async () => {
    serviceMock.findOne.mockResolvedValue(baseLocation);

    const result = await resolver.location(jwtUser, 'loc-1', tenantId);

    expect(serviceMock.assertTenantAccess).toHaveBeenCalledWith(tenantId, tenantId);
    expect(result.restaurantId).toBe(tenantId);
    expect(result.id).toBe('loc-1');
  });

  it('createLocation validates input.restaurantId against JWT', async () => {
    serviceMock.create.mockResolvedValue(baseLocation);
    const input: CreateLocationInput = {
      name: 'Sede Nueva',
      address: 'Calle 2',
      restaurantId: tenantId,
    };

    await resolver.createLocation(jwtUser, input);

    expect(serviceMock.assertTenantAccess).toHaveBeenCalledWith(tenantId, tenantId);
    expect(serviceMock.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        name: 'Sede Nueva',
        address: 'Calle 2',
        city: undefined,
        phone: undefined,
      }),
    );
  });

  it('updateLocation delegates to service with user.tenantId', async () => {
    serviceMock.update.mockResolvedValue(baseLocation);
    const input: UpdateLocationInput = { name: 'Sede Actualizada' };

    await resolver.updateLocation(jwtUser, 'loc-1', input);

    expect(serviceMock.update).toHaveBeenCalledWith(tenantId, 'loc-1', input);
  });

  it('deleteLocation returns true', async () => {
    serviceMock.delete.mockResolvedValue(true);

    await expect(resolver.deleteLocation(jwtUser, 'loc-1')).resolves.toBe(true);
    expect(serviceMock.delete).toHaveBeenCalledWith(tenantId, 'loc-1');
  });

  it('toggleLocationStatus returns mapped location', async () => {
    serviceMock.toggleStatus.mockResolvedValue({ ...baseLocation, isActive: false });

    const result = await resolver.toggleLocationStatus(jwtUser, 'loc-1');

    expect(result.isActive).toBe(false);
    expect(result.restaurantId).toBe(tenantId);
  });
});
