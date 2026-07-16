import type {
  AttendanceEventType,
  AttendanceLog,
  AttendanceMarkingScope,
  AttendanceShift,
  AttendanceValidationStatus,
  EmployeeDetails,
  Location,
} from '@prisma/client';

// ── Composed types ──────────────────────────────────────────────────────────

export type MobileAttendanceLogFull = {
  id: string;
  tenantId: string;
  employeeId: string;
  locationId: string;
  eventType: AttendanceEventType;
  status: AttendanceValidationStatus;
  timestamp: Date;
  workDate: Date;
  distanceMeters: number | null;
  photoUrl: string | null;
  facialMatchScore: number | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: Date;
  employee: EmployeeDetails;
  location: Pick<Location, 'id' | 'name' | 'geoLatitude' | 'geoLongitude' | 'checkInRadiusMeters'>;
};

// ── Input shapes ────────────────────────────────────────────────────────────

export interface RegistrarMarcacionInput {
  locationId: string;
  eventType: AttendanceEventType;
  clientLatitude: number;
  clientLongitude: number;
  storageObjectId?: string | null;
  facialMatchScore?: number | null;
  facialMatchResult?: string | null;
  timestamp?: Date | null;
  notes?: string | null;
  markingScope?: AttendanceMarkingScope;
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
  status?: AttendanceValidationStatus | null;
  cursor?: string | null;
  take?: number;
}

export interface MarcacionesPorEmpleadoInput {
  employeeId: string;
  dateFrom: string;
  dateTo: string;
  status?: AttendanceValidationStatus | null;
  cursor?: string | null;
  take?: number;
}

// ── Result shapes ───────────────────────────────────────────────────────────

export interface MarcacionResult {
  id: string;
  status: AttendanceValidationStatus;
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

export interface FacialReferenceResult {
  storageObjectId: string;
  signedUrl: string;
  version: string;
  updatedAt: Date;
}

export type EmployeeWithFacialReference = EmployeeDetails & {
  personalData: { profilePhotoStorageObjectId: string | null; updatedAt: Date } | null;
  photoStorageObjectId: string | null;
  updatedAt: Date;
};

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface MarcacionConnection {
  edges: MobileAttendanceLogFull[];
  pageInfo: PageInfo;
}

/** Payload persistido en attendance_logs (source=APP_MOVIL). */
export interface CreateMobileAttendanceLogData {
  tenantId: string;
  employeeId: string;
  locationId: string;
  eventType: AttendanceEventType;
  timestamp: Date;
  workDate: Date;
  shift?: AttendanceShift | null;
  notes?: string | null;
  validationStatus?: AttendanceValidationStatus | null;
  clientLatitude?: number | null;
  clientLongitude?: number | null;
  distanceMeters?: number | null;
  radiusMeters?: number | null;
  storageObjectId?: string | null;
  photoUrl?: string | null;
  facialMatchScore?: number | null;
  facialMatchResult?: string | null;
  rejectionReason?: string | null;
  markingScope?: AttendanceMarkingScope;
}

export interface MobileAttendanceFindManyFilters {
  tenantId: string;
  employeeId?: string;
  locationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: AttendanceValidationStatus | null;
  cursor?: string;
  take: number;
}

// ── Repository contract ─────────────────────────────────────────────────────

export interface IMobileAttendanceRepository {
  create(data: CreateMobileAttendanceLogData): Promise<AttendanceLog>;
  findMany(filters: MobileAttendanceFindManyFilters): Promise<MarcacionConnection>;
  findEmployeeByUserId(userId: string, tenantId: string): Promise<EmployeeDetails | null>;
  findEmployeeWithFacialReference(
    userId: string,
    tenantId: string,
  ): Promise<EmployeeWithFacialReference | null>;
  findLocationById(locationId: string, tenantId: string): Promise<Location | null>;
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
      status?: AttendanceValidationStatus | null;
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
      status?: AttendanceValidationStatus | null;
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
  misDatosFaciales(userId: string, tenantId: string): Promise<FacialReferenceResult | null>;
  miSede(userId: string, tenantId: string): Promise<SedeMarcacionConfigResult>;
}
