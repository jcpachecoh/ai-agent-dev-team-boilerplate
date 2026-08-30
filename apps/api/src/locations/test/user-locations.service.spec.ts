import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { UserLocationsRepository } from '../repository/user-locations.repository';
import { UserLocationsService } from '../service/user-locations.service';

const baseUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  cedula: '12345678',
  documentType: 'CC' as const,
  email: 'user@test.dev',
  passwordHash: 'hash',
  roleId: 'role-1',
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

const baseAssignment = {
  id: 'ul-1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  locationId: 'loc-1',
  createdAt: new Date(),
};

const repositoryMock = {
  findAssignment: jest.fn(),
  createAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
  findUsersByLocation: jest.fn(),
  findLocationsByUser: jest.fn(),
  findUserForTenant: jest.fn(),
  findLocationForTenant: jest.fn(),
};

describe('UserLocationsService', () => {
  let service: UserLocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserLocationsService,
        { provide: UserLocationsRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<UserLocationsService>(UserLocationsService);
    jest.clearAllMocks();
  });

  it('assertTenantAccess throws ForbiddenException on mismatch', () => {
    expect(() => service.assertTenantAccess('tenant-a', 'tenant-b')).toThrow(ForbiddenException);
  });

  it('assertTenantAccess passes on match', () => {
    expect(() => service.assertTenantAccess('tenant-a', 'tenant-a')).not.toThrow();
  });

  it('assign throws NotFoundException when user is from another tenant', async () => {
    repositoryMock.findUserForTenant.mockResolvedValue(null);

    await expect(service.assign('tenant-1', 'user-other', 'loc-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('assign throws NotFoundException when location is from another tenant', async () => {
    repositoryMock.findUserForTenant.mockResolvedValue(baseUser);
    repositoryMock.findLocationForTenant.mockResolvedValue(null);

    await expect(service.assign('tenant-1', 'user-1', 'loc-other')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('assign throws BadRequestException when user is inactive', async () => {
    repositoryMock.findUserForTenant.mockResolvedValue({ ...baseUser, isActive: false });

    await expect(service.assign('tenant-1', 'user-1', 'loc-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('assign throws ConflictException on duplicate assignment', async () => {
    repositoryMock.findUserForTenant.mockResolvedValue(baseUser);
    repositoryMock.findLocationForTenant.mockResolvedValue(baseLocation);
    repositoryMock.createAssignment.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );

    await expect(service.assign('tenant-1', 'user-1', 'loc-1')).rejects.toThrow(ConflictException);
  });

  it('assign returns UserLocation on happy path', async () => {
    repositoryMock.findUserForTenant.mockResolvedValue(baseUser);
    repositoryMock.findLocationForTenant.mockResolvedValue(baseLocation);
    repositoryMock.createAssignment.mockResolvedValue(baseAssignment);

    await expect(service.assign('tenant-1', 'user-1', 'loc-1')).resolves.toEqual(baseAssignment);
  });

  it('assign allows inactive location', async () => {
    repositoryMock.findUserForTenant.mockResolvedValue(baseUser);
    repositoryMock.findLocationForTenant.mockResolvedValue({ ...baseLocation, isActive: false });
    repositoryMock.createAssignment.mockResolvedValue(baseAssignment);

    await expect(service.assign('tenant-1', 'user-1', 'loc-1')).resolves.toEqual(baseAssignment);
  });

  it('remove throws NotFoundException when assignment missing', async () => {
    repositoryMock.findAssignment.mockResolvedValue(null);

    await expect(service.remove('tenant-1', 'user-1', 'loc-1')).rejects.toThrow(NotFoundException);
  });

  it('remove returns true on happy path', async () => {
    repositoryMock.findAssignment.mockResolvedValue(baseAssignment);
    repositoryMock.deleteAssignment.mockResolvedValue(undefined);

    await expect(service.remove('tenant-1', 'user-1', 'loc-1')).resolves.toBe(true);
    expect(repositoryMock.deleteAssignment).toHaveBeenCalledWith('tenant-1', 'user-1', 'loc-1');
  });

  it('getLocationUsers requests active users only by default', async () => {
    repositoryMock.findLocationForTenant.mockResolvedValue(baseLocation);
    repositoryMock.findUsersByLocation.mockResolvedValue([baseUser]);

    await service.getLocationUsers('tenant-1', 'loc-1');

    expect(repositoryMock.findUsersByLocation).toHaveBeenCalledWith('tenant-1', 'loc-1', true);
  });

  it('getLocationUsers throws NotFoundException when location missing', async () => {
    repositoryMock.findLocationForTenant.mockResolvedValue(null);

    await expect(service.getLocationUsers('tenant-1', 'loc-missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getUserLocations throws NotFoundException when user is from another tenant', async () => {
    repositoryMock.findUserForTenant.mockResolvedValue(null);

    await expect(service.getUserLocations('tenant-1', 'user-other')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getUserLocations returns locations for user', async () => {
    repositoryMock.findUserForTenant.mockResolvedValue(baseUser);
    repositoryMock.findLocationsByUser.mockResolvedValue([baseLocation]);

    await expect(service.getUserLocations('tenant-1', 'user-1')).resolves.toEqual([baseLocation]);
  });
});
