import { Test, TestingModule } from '@nestjs/testing';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { UserLocationsResolver } from '../resolver/user-locations.resolver';
import { UserLocationsService } from '../service/user-locations.service';

const tenantId = 'palos-de-lena';

const jwtUser: JwtPayload = {
  sub: 'user-1',
  email: 'owner@test.dev',
  tenantId,
  roleId: 'role-1',
  roleCode: 'OWNER',
};

const baseAssignment = {
  id: 'ul-1',
  tenantId,
  userId: 'user-2',
  locationId: 'loc-1',
  createdAt: new Date('2026-01-01'),
};

const baseUser = {
  id: 'user-2',
  tenantId,
  cedula: '87654321',
  documentType: 'CC' as const,
  email: 'operator@test.dev',
  passwordHash: 'hash',
  roleId: 'role-2',
  loginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  passwordChangedAt: null,
  refreshToken: null,
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  createdBy: null,
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
  assign: jest.fn(),
  remove: jest.fn(),
  getLocationUsers: jest.fn(),
  getUserLocations: jest.fn(),
};

describe('UserLocationsResolver', () => {
  let resolver: UserLocationsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserLocationsResolver, { provide: UserLocationsService, useValue: serviceMock }],
    }).compile();

    resolver = module.get<UserLocationsResolver>(UserLocationsResolver);
    jest.clearAllMocks();
  });

  it('assignUserToLocation delegates with user.tenantId', async () => {
    serviceMock.assign.mockResolvedValue(baseAssignment);

    const result = await resolver.assignUserToLocation(jwtUser, 'user-2', 'loc-1');

    expect(serviceMock.assign).toHaveBeenCalledWith(tenantId, 'user-2', 'loc-1');
    expect(result).toEqual(
      expect.objectContaining({
        id: 'ul-1',
        userId: 'user-2',
        locationId: 'loc-1',
        restaurantId: tenantId,
      }),
    );
  });

  it('removeUserFromLocation returns true', async () => {
    serviceMock.remove.mockResolvedValue(true);

    await expect(resolver.removeUserFromLocation(jwtUser, 'user-2', 'loc-1')).resolves.toBe(true);
    expect(serviceMock.remove).toHaveBeenCalledWith(tenantId, 'user-2', 'loc-1');
  });

  it('locationUsers calls assertTenantAccess and getLocationUsers', async () => {
    serviceMock.getLocationUsers.mockResolvedValue([baseUser]);

    await resolver.locationUsers(jwtUser, 'loc-1', tenantId);

    expect(serviceMock.assertTenantAccess).toHaveBeenCalledWith(tenantId, tenantId);
    expect(serviceMock.getLocationUsers).toHaveBeenCalledWith(tenantId, 'loc-1');
  });

  it('locationUsers maps LocationAssignedUserType', async () => {
    serviceMock.getLocationUsers.mockResolvedValue([baseUser]);

    const result = await resolver.locationUsers(jwtUser, 'loc-1', tenantId);

    expect(result[0]).toEqual({
      id: 'user-2',
      email: 'operator@test.dev',
      cedula: '87654321',
      isActive: true,
      restaurantId: tenantId,
    });
  });

  it('userLocations validates tenant and maps LocationType', async () => {
    serviceMock.getUserLocations.mockResolvedValue([baseLocation]);

    const result = await resolver.userLocations(jwtUser, 'user-2', tenantId);

    expect(serviceMock.assertTenantAccess).toHaveBeenCalledWith(tenantId, tenantId);
    expect(serviceMock.getUserLocations).toHaveBeenCalledWith(tenantId, 'user-2');
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'loc-1',
        restaurantId: tenantId,
        name: 'Sede Principal',
      }),
    );
  });
});
