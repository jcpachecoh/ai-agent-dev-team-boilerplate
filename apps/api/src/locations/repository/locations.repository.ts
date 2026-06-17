import { Injectable } from '@nestjs/common';
import type { Location } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateLocationData,
  ILocationsRepository,
  UpdateLocationData,
} from '../interfaces/locations.interfaces';

@Injectable()
export class LocationsRepository implements ILocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(tenantId: string, cursor?: string, take = 20): Promise<Location[]> {
    return this.prisma.location.findMany({
      where: { tenantId, deletedAt: null },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(tenantId: string, id: string): Promise<Location | null> {
    return this.prisma.location.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  create(tenantId: string, data: CreateLocationData): Promise<Location> {
    return this.prisma.location.create({
      data: {
        tenantId,
        name: data.name,
        address: data.address,
        city: data.city,
        phone: data.phone,
      },
    });
  }

  update(tenantId: string, id: string, data: UpdateLocationData): Promise<Location> {
    void tenantId;
    return this.prisma.location.update({
      where: { id },
      data,
    });
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    void tenantId;
    await this.prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async toggleStatus(tenantId: string, id: string): Promise<Location> {
    const current = await this.findById(tenantId, id);
    if (!current) {
      return this.prisma.location.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.location.update({
      where: { id },
      data: { isActive: !current.isActive },
    });
  }
}
