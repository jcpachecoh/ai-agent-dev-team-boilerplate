import type { Location } from '@prisma/client';
import type { LocationBusinessHours } from '../types/business-hours.types';

export interface LocationCursorPage {
  items: Location[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface CreateLocationData {
  name: string;
  address: string;
  city?: string | null;
  phone?: string | null;
  businessHours?: LocationBusinessHours | null;
  openingTime?: string | null;
  closingTime?: string | null;
}

export interface UpdateLocationData {
  name?: string;
  address?: string;
  city?: string | null;
  phone?: string | null;
  isActive?: boolean;
  businessHours?: LocationBusinessHours | null;
  openingTime?: string | null;
  closingTime?: string | null;
}

export interface ILocationsRepository {
  findMany(tenantId: string, cursor?: string, take?: number): Promise<Location[]>;
  findById(tenantId: string, id: string): Promise<Location | null>;
  create(tenantId: string, data: CreateLocationData): Promise<Location>;
  update(tenantId: string, id: string, data: UpdateLocationData): Promise<Location>;
  softDelete(tenantId: string, id: string): Promise<void>;
  toggleStatus(tenantId: string, id: string): Promise<Location>;
}

export interface ILocationsService {
  findAll(tenantId: string, cursor?: string, take?: number): Promise<LocationCursorPage>;
  findOne(tenantId: string, id: string): Promise<Location>;
  create(tenantId: string, data: CreateLocationData): Promise<Location>;
  update(tenantId: string, id: string, data: UpdateLocationData): Promise<Location>;
  delete(tenantId: string, id: string): Promise<boolean>;
  toggleStatus(tenantId: string, id: string): Promise<Location>;
  assertTenantAccess(jwtTenantId: string, requestedRestaurantId: string): void;
}
