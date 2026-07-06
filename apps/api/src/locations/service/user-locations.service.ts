import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Location, User, UserLocation } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { LOCATION_SCOPED_ROLES } from '../../common/config/rbac.config';
import type { IUserLocationsService } from '../interfaces/user-locations.interfaces';
import { UserLocationsRepository } from '../repository/user-locations.repository';

@Injectable()
export class UserLocationsService implements IUserLocationsService {
  constructor(private readonly repository: UserLocationsRepository) {}

  assertTenantAccess(jwtTenantId: string, requestedRestaurantId: string): void {
    if (jwtTenantId !== requestedRestaurantId) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async assign(tenantId: string, userId: string, locationId: string): Promise<UserLocation> {
    const user = await this.repository.findUserForTenant(tenantId, userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (!user.isActive) {
      throw new BadRequestException('No se puede asignar un usuario inactivo');
    }

    const location = await this.repository.findLocationForTenant(tenantId, locationId);
    if (!location) {
      throw new NotFoundException('Sede no encontrada');
    }

    try {
      return await this.repository.createAssignment(tenantId, userId, locationId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('El usuario ya está asignado a esta sede');
      }
      throw error;
    }
  }

  async remove(tenantId: string, userId: string, locationId: string): Promise<boolean> {
    const assignment = await this.repository.findAssignment(tenantId, userId, locationId);
    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    await this.repository.deleteAssignment(tenantId, userId, locationId);
    return true;
  }

  async getLocationUsers(tenantId: string, locationId: string, activeOnly = true): Promise<User[]> {
    const location = await this.repository.findLocationForTenant(tenantId, locationId);
    if (!location) {
      throw new NotFoundException('Sede no encontrada');
    }

    return this.repository.findUsersByLocation(tenantId, locationId, activeOnly);
  }

  async getUserLocations(tenantId: string, userId: string): Promise<Location[]> {
    const user = await this.repository.findUserForTenant(tenantId, userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.repository.findLocationsByUser(tenantId, userId);
  }

  async getActiveUserLocations(tenantId: string, userId: string): Promise<Location[]> {
    const user = await this.repository.findUserForTenant(tenantId, userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.repository.findActiveLocationsByUser(tenantId, userId);
  }

  /**
   * Sedes permitidas para un actor: `null` = sin restricción (admin/nómina),
   * array = sedes asignadas en `UserLocation` (SUPERVISOR/MANAGER). Mismo
   * patrón que `TurnoAssignmentsService.resolveScope`, reutilizable por
   * cualquier módulo que necesite acotar lecturas por sede (attendance, payroll, reports).
   */
  async resolveAllowedLocationIds(
    tenantId: string,
    actor: { userId: string; roleCode: string },
  ): Promise<string[] | null> {
    const isLocationScoped = (LOCATION_SCOPED_ROLES as readonly string[]).includes(actor.roleCode);
    if (!isLocationScoped) {
      return null;
    }

    const locations = await this.getActiveUserLocations(tenantId, actor.userId);
    return locations.map((location): string => location.id);
  }

  assertLocationAllowed(allowedLocationIds: string[] | null, locationId: string): void {
    if (allowedLocationIds && !allowedLocationIds.includes(locationId)) {
      throw new ForbiddenException('No tiene acceso a esta sede');
    }
  }
}
