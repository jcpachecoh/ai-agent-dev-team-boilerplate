import type {
  EmployeeDetails,
  Location,
  MobileAttendanceEventType,
  MobileAttendanceLog,
  MobileAttendanceStatus,
} from '@prisma/client';

// ── Composed types ──────────────────────────────────────────────────────────

export type MobileAttendanceLogFull = MobileAttendanceLog & {
  employee: EmployeeDetails;
  location: Pick<Location, 'id' | 'name' | 'geoLatitude' | 'geoLongitude' | 'checkInRadiusMeters'>;
};

// ── Input shapes ────────────────────────────────────────────────────────────

export interface RegistrarMarcacionInput {
  locationId: string;
  eventType: MobileAttendanceEventType;
  clientLatitude: number;
  clientLongitude: number;
  storageObjectId?: string | null;
  facialMatchScore?: number | null;
  facialMatchResult?: string | null;
  timestamp?: Date | null;
  notes?: string | null;
}

export interface MisMarcacionesInput {
  cursor?: string | null;
  take?: number;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface MarcacionesPorSedeInput {
  locationId: string;
  dateFrom: string;
  dateTo: string;
  status?: MobileAttendanceStatus | null;
  cursor?: string | null;
  take?: number;
}

export interface MarcacionesPorEmpleadoInput {
  employeeId: string;
  dateFrom: string;
  dateTo: string;
  status?: MobileAttendanceStatus | null;
  cursor?: string | null;
  take?: number;
}

// ── Result shapes ───────────────────────────────────────────────────────────

export interface MarcacionResult {
  id: string;
  status: MobileAttendanceStatus;
  distanceMeters: number | null;
  rejectionReason: string | null;
  timestamp: Date;
  workDate: Date;
}

export interface SedeMarcacionConfigResult {
  locationId: string;
  name: string;
  geoLatitude: number | null;
  geoLongitude: number | null;
  checkInRadiusMeters: number | null;
  requiresPhoto: boolean;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface MarcacionConnection {
  edges: MobileAttendanceLogFull[];
  pageInfo: PageInfo;
}

// ── Create data ─────────────────────────────────────────────────────────────

export interface CreateMobileAttendanceData {
  tenantId: string;
  employeeId: string;
  locationId: string;
  eventType: MobileAttendanceEventType;
  status: MobileAttendanceStatus;
  timestamp: Date;
  workDate: Date;
  clientLatitude: number;
  clientLongitude: number;
  distanceMeters: number | null;
  radiusMeters: number | null;
  storageObjectId: string | null;
  photoUrl: string | null;
  facialMatchScore: number | null;
  facialMatchResult: string | null;
  rejectionReason: string | null;
  notes: string | null;
}

// ── Repository contract ─────────────────────────────────────────────────────

export interface IMobileAttendanceRepository {
  findEmployeeByUserId(userId: string, tenantId: string): Promise<EmployeeDetails | null>;
  findLocationById(locationId: string, tenantId: string): Promise<Location | null>;
  create(data: CreateMobileAttendanceData): Promise<MobileAttendanceLog>;
  findByEmployeeId(
    employeeId: string,
    tenantId: string,
    filters: { dateFrom?: Date; dateTo?: Date; cursor?: string; take: number },
  ): Promise<MarcacionConnection>;
  findByLocationId(
    locationId: string,
    tenantId: string,
    filters: {
      dateFrom: Date;
      dateTo: Date;
      status?: MobileAttendanceStatus | null;
      cursor?: string;
      take: number;
    },
  ): Promise<MarcacionConnection>;
  findByEmployeeIdAdmin(
    employeeId: string,
    tenantId: string,
    filters: {
      dateFrom: Date;
      dateTo: Date;
      status?: MobileAttendanceStatus | null;
      cursor?: string;
      take: number;
    },
  ): Promise<MarcacionConnection>;
}

// ── Service contract ────────────────────────────────────────────────────────

export interface IMobileAttendanceService {
  registrarMarcacion(
    input: RegistrarMarcacionInput,
    userId: string,
    tenantId: string,
  ): Promise<MarcacionResult>;
  misMarcaciones(
    userId: string,
    tenantId: string,
    input: MisMarcacionesInput,
  ): Promise<MarcacionConnection>;
  marcacionesPorSede(
    input: MarcacionesPorSedeInput,
    tenantId: string,
  ): Promise<MarcacionConnection>;
  marcacionesPorEmpleado(
    input: MarcacionesPorEmpleadoInput,
    tenantId: string,
  ): Promise<MarcacionConnection>;
  sedeMarcacionConfig(locationId: string, tenantId: string): Promise<SedeMarcacionConfigResult>;
}
