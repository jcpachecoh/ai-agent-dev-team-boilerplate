import { Injectable } from '@nestjs/common';
import type { Location, User, UserLocation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { IUserLocationsRepository } from '../interfaces/user-locations.interfaces';

@Injectable()
export class UserLocationsRepository implements IUserLocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAssignment(
    tenantId: string,
    userId: string,
    locationId: string,
  ): Promise<UserLocation | null> {
    return this.prisma.userLocation.findFirst({
      where: { tenantId, userId, locationId },
    });
  }

  createAssignment(tenantId: string, userId: string, locationId: string): Promise<UserLocation> {
    return this.prisma.userLocation.create({
      data: { tenantId, userId, locationId },
    });
  }

  async deleteAssignment(tenantId: string, userId: string, locationId: string): Promise<void> {
    await this.prisma.userLocation.deleteMany({
      where: { tenantId, userId, locationId },
    });
  }

  findUsersByLocation(tenantId: string, locationId: string, activeOnly: boolean): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(activeOnly ? { isActive: true } : {}),
        userLocations: { some: { locationId, tenantId } },
      },
      orderBy: { email: 'asc' },
    });
  }

  findLocationsByUser(tenantId: string, userId: string): Promise<Location[]> {
    return this.prisma.location.findMany({
      where: {
        tenantId,
        deletedAt: null,
        users: { some: { userId, tenantId } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findActiveLocationsByUser(tenantId: string, userId: string): Promise<Location[]> {
    return this.prisma.location.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        users: { some: { userId, tenantId } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findUserForTenant(tenantId: string, userId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });
  }

  findLocationForTenant(tenantId: string, locationId: string): Promise<Location | null> {
    return this.prisma.location.findFirst({
      where: { id: locationId, tenantId, deletedAt: null },
    });
  }
}
