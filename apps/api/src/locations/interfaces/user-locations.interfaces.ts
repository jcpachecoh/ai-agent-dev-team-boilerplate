import type { Location, User, UserLocation } from '@prisma/client';

export type UserLocationWithRelations = UserLocation & {
  user?: User;
  location?: Location;
};

export interface IUserLocationsRepository {
  findAssignment(
    tenantId: string,
    userId: string,
    locationId: string,
  ): Promise<UserLocation | null>;
  createAssignment(tenantId: string, userId: string, locationId: string): Promise<UserLocation>;
  deleteAssignment(tenantId: string, userId: string, locationId: string): Promise<void>;
  findUsersByLocation(tenantId: string, locationId: string, activeOnly: boolean): Promise<User[]>;
  findLocationsByUser(tenantId: string, userId: string): Promise<Location[]>;
  findActiveLocationsByUser(tenantId: string, userId: string): Promise<Location[]>;
  findUserForTenant(tenantId: string, userId: string): Promise<User | null>;
  findLocationForTenant(tenantId: string, locationId: string): Promise<Location | null>;
}

export interface IUserLocationsService {
  assign(tenantId: string, userId: string, locationId: string): Promise<UserLocation>;
  remove(tenantId: string, userId: string, locationId: string): Promise<boolean>;
  getLocationUsers(tenantId: string, locationId: string, activeOnly?: boolean): Promise<User[]>;
  getUserLocations(tenantId: string, userId: string): Promise<Location[]>;
  getActiveUserLocations(tenantId: string, userId: string): Promise<Location[]>;
  assertTenantAccess(jwtTenantId: string, requestedRestaurantId: string): void;
}
