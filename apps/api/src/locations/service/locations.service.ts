import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Location } from '@prisma/client';
import type {
  CreateLocationData,
  ILocationsService,
  LocationCursorPage,
  UpdateLocationData,
} from '../interfaces/locations.interfaces';
import { LocationsRepository } from '../repository/locations.repository';

@Injectable()
export class LocationsService implements ILocationsService {
  constructor(private readonly repository: LocationsRepository) {}

  assertTenantAccess(jwtTenantId: string, requestedRestaurantId: string): void {
    if (jwtTenantId !== requestedRestaurantId) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async findAll(tenantId: string, cursor?: string, take = 20): Promise<LocationCursorPage> {
    const rows = await this.repository.findMany(tenantId, cursor, take);
    const hasNextPage = rows.length > take;
    const items = hasNextPage ? rows.slice(0, take) : rows;

    return {
      items,
      hasNextPage,
      endCursor: items.at(-1)?.id ?? null,
    };
  }

  async findOne(tenantId: string, id: string): Promise<Location> {
    const location = await this.repository.findById(tenantId, id);
    if (!location) {
      throw new NotFoundException(`Sede ${id} no encontrada`);
    }
    return location;
  }

  async create(tenantId: string, data: CreateLocationData): Promise<Location> {
    if (!data.name?.trim()) {
      throw new BadRequestException('El nombre es requerido');
    }
    if (!data.address?.trim()) {
      throw new BadRequestException('La dirección es requerida');
    }

    return this.repository.create(tenantId, data);
  }

  async update(tenantId: string, id: string, data: UpdateLocationData): Promise<Location> {
    await this.findOne(tenantId, id);
    return this.repository.update(tenantId, id, data);
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    await this.findOne(tenantId, id);
    await this.repository.softDelete(tenantId, id);
    return true;
  }

  async toggleStatus(tenantId: string, id: string): Promise<Location> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Sede ${id} no encontrada`);
    }
    return this.repository.toggleStatus(tenantId, id);
  }
}
