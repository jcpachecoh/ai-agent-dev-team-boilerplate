import type {
  Location,
  SupplierDeliveryMode,
  SupplierDeliveryPlace,
  SupplierLogistics,
  SupplierLogisticsStatus,
  SupplierTransportCostCurrency,
  SupplierTransportType,
  User,
} from '@prisma/client';

export interface SupplierLogisticsInput {
  deliveryMode?: SupplierDeliveryMode | null;
  deliveryPlace?: SupplierDeliveryPlace | null;
  deliveryPlaceCustom?: string | null;
  deliveryDays?: number[];
  leadTimeDays?: number | null;
  timeWindowStart?: string | null;
  timeWindowEnd?: string | null;
  receptionResponsibleUserId?: string | null;
  transportType?: SupplierTransportType | null;
  requiresColdChain?: boolean;
  transportTempMinC?: number | null;
  transportTempMaxC?: number | null;
  transportCost?: number | null;
  transportCostCurrency?: SupplierTransportCostCurrency | null;
  minimumOrderQty?: number | null;
  minimumOrderUnit?: string | null;
  coverageLocationIds?: string[];
}

export type SupplierLogisticsWithRelations = SupplierLogistics & {
  receptionResponsibleUser: User | null;
  coverageLocations: Array<{
    locationId: string;
    location: Location;
  }>;
};

export interface SupplierLogisticsView {
  id: string;
  tenantId: string;
  supplierId: string;
  deliveryMode: SupplierDeliveryMode | null;
  deliveryPlace: SupplierDeliveryPlace | null;
  deliveryPlaceCustom: string | null;
  deliveryDays: number[];
  leadTimeDays: number | null;
  timeWindowStart: string | null;
  timeWindowEnd: string | null;
  receptionResponsibleUserId: string | null;
  receptionResponsible: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  receptionResponsibleStale: boolean;
  transportType: SupplierTransportType | null;
  requiresColdChain: boolean;
  transportTempMinC: number | null;
  transportTempMaxC: number | null;
  transportCost: number | null;
  transportCostCurrency: SupplierTransportCostCurrency | null;
  minimumOrderQty: number | null;
  minimumOrderUnit: string | null;
  coverageLocations: Array<{ id: string; name: string }>;
  status: SupplierLogisticsStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierLogisticsHistoryEntry {
  id: string;
  action: string;
  actorUserId: string | null;
  actorEmail: string | null;
  createdAt: Date;
  changes: Array<{ field: string; old: unknown; new: unknown }>;
}

export interface ISupplierLogisticsRepository {
  findBySupplierId(
    tenantId: string,
    supplierId: string,
  ): Promise<SupplierLogisticsWithRelations | null>;
  upsert(params: {
    tenantId: string;
    supplierId: string;
    data: SupplierLogisticsInput;
    status: SupplierLogisticsStatus;
  }): Promise<SupplierLogisticsWithRelations>;
  findUserInTenant(tenantId: string, userId: string): Promise<User | null>;
  findLocationsInTenant(tenantId: string, locationIds: string[]): Promise<Location[]>;
  findHistory(
    tenantId: string,
    logisticsId: string,
  ): Promise<
    Array<{
      id: string;
      action: string;
      actorUserId: string | null;
      createdAt: Date;
      payload: unknown;
      actor: { email: string } | null;
    }>
  >;
}

export interface ISupplierLogisticsService {
  findBySupplierId(tenantId: string, supplierId: string): Promise<SupplierLogisticsView | null>;
  upsert(params: {
    tenantId: string;
    supplierId: string;
    input: SupplierLogisticsInput;
    saveAsDraft: boolean;
    actorUserId?: string | null;
    previous?: SupplierLogisticsWithRelations | null;
  }): Promise<SupplierLogisticsView>;
  getHistory(tenantId: string, supplierId: string): Promise<SupplierLogisticsHistoryEntry[]>;
}
