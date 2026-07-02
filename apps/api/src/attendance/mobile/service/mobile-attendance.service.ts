import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MobileAttendanceStatus, StorageDomain } from '@prisma/client';
import { StorageService } from '../../../storage/service/storage.service';
import { normalizeWorkDate } from '../../repository/attendance.repository';
import type {
  IMobileAttendanceService,
  FacialReferenceResult,
  MarcacionConnection,
  MarcacionResult,
  MarcacionesPorEmpleadoInput,
  MarcacionesPorSedeInput,
  MisMarcacionesInput,
  RegistrarMarcacionInput,
  SedeMarcacionConfigResult,
} from '../interfaces/mobile-attendance.interfaces';
import { MobileAttendanceRepository } from '../repository/mobile-attendance.repository';

const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_TAKE = 20;
const FACIAL_REFERENCE_URL_TTL_SECONDS = 600;

@Injectable()
export class MobileAttendanceService implements IMobileAttendanceService {
  private readonly logger = new Logger(MobileAttendanceService.name);

  constructor(
    private readonly repo: MobileAttendanceRepository,
    private readonly storageService: StorageService,
  ) {}

  async registrarMarcacion(
    input: RegistrarMarcacionInput,
    userId: string,
    tenantId: string,
  ): Promise<MarcacionResult> {
    // 1 — Resolve employee from JWT userId
    const employee = await this.repo.findEmployeeByUserId(userId, tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado para este tenant');
    }
    if (!employee.isActive) {
      throw new ForbiddenException('Empleado inactivo');
    }

    // 2 — Validate location belongs to tenant
    const location = await this.repo.findLocationById(input.locationId, tenantId);
    if (!location) {
      throw new NotFoundException(`Sede ${input.locationId} no encontrada`);
    }

    // 3 — Validate employee assignment to this location
    if (employee.locationId !== input.locationId) {
      throw new ForbiddenException('El empleado no está asignado a esta sede');
    }

    // 4 — Validate timestamp (max 5 min drift to prevent replay)
    const now = new Date();
    const timestamp = input.timestamp ?? now;
    if (Math.abs(timestamp.getTime() - now.getTime()) > MAX_TIMESTAMP_DRIFT_MS) {
      throw new BadRequestException('Timestamp demasiado desfasado (máximo 5 minutos)');
    }

    // 5 — Validate storageObjectId ownership and domain
    let photoUrl: string | null = null;
    if (input.storageObjectId) {
      const storageObj = await this.storageService.findById(input.storageObjectId, tenantId);
      if (storageObj.uploadedBy !== userId) {
        throw new ForbiddenException('storageObjectId no pertenece al usuario autenticado');
      }
      if (storageObj.domain !== StorageDomain.PAYROLL) {
        throw new BadRequestException('storageObjectId debe ser del dominio PAYROLL');
      }
      photoUrl = storageObj.publicUrl;
    }

    // 6 — Calculate distance and determine status
    const workDate = normalizeWorkDate(timestamp);
    const { status, distanceMeters, rejectionReason, radiusMeters } = this.validateGeofence(
      input.clientLatitude,
      input.clientLongitude,
      location.geoLatitude,
      location.geoLongitude,
      location.checkInRadiusMeters,
    );

    const log = await this.repo.create({
      tenantId,
      employeeId: employee.id,
      locationId: input.locationId,
      eventType: input.eventType,
      status,
      timestamp,
      workDate,
      clientLatitude: input.clientLatitude,
      clientLongitude: input.clientLongitude,
      distanceMeters,
      radiusMeters,
      storageObjectId: input.storageObjectId ?? null,
      photoUrl,
      facialMatchScore: input.facialMatchScore ?? null,
      facialMatchResult: input.facialMatchResult ?? null,
      rejectionReason,
      notes: input.notes ?? null,
    });

    this.logger.log(
      `MOBILE ${input.eventType}: employeeId=${employee.id} locationId=${input.locationId} status=${status} dist=${distanceMeters?.toFixed(0) ?? 'n/a'}m`,
    );

    return {
      id: log.id,
      status,
      distanceMeters,
      rejectionReason,
      timestamp: log.timestamp,
      workDate: log.workDate,
    };
  }

  async misMarcaciones(
    userId: string,
    tenantId: string,
    input: MisMarcacionesInput,
  ): Promise<MarcacionConnection> {
    const employee = await this.repo.findEmployeeByUserId(userId, tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    return this.repo.findByEmployeeId(employee.id, tenantId, {
      dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
      cursor: input.cursor ?? undefined,
      take: input.take ?? DEFAULT_TAKE,
    });
  }

  async marcacionesPorSede(
    input: MarcacionesPorSedeInput,
    tenantId: string,
  ): Promise<MarcacionConnection> {
    const location = await this.repo.findLocationById(input.locationId, tenantId);
    if (!location) {
      throw new NotFoundException(`Sede ${input.locationId} no encontrada`);
    }

    return this.repo.findByLocationId(input.locationId, tenantId, {
      dateFrom: new Date(input.dateFrom),
      dateTo: new Date(input.dateTo),
      status: input.status,
      cursor: input.cursor ?? undefined,
      take: input.take ?? DEFAULT_TAKE,
    });
  }

  async marcacionesPorEmpleado(
    input: MarcacionesPorEmpleadoInput,
    tenantId: string,
  ): Promise<MarcacionConnection> {
    return this.repo.findByEmployeeIdAdmin(input.employeeId, tenantId, {
      dateFrom: new Date(input.dateFrom),
      dateTo: new Date(input.dateTo),
      status: input.status,
      cursor: input.cursor ?? undefined,
      take: input.take ?? DEFAULT_TAKE,
    });
  }

  async sedeMarcacionConfig(
    locationId: string,
    tenantId: string,
  ): Promise<SedeMarcacionConfigResult> {
    const location = await this.repo.findLocationById(locationId, tenantId);
    if (!location) {
      throw new NotFoundException(`Sede ${locationId} no encontrada`);
    }

    return this.toSedeMarcacionConfig(location);
  }

  async misDatosFaciales(userId: string, tenantId: string): Promise<FacialReferenceResult | null> {
    const employee = await this.repo.findEmployeeWithFacialReference(userId, tenantId);
    if (!employee) {
      return null;
    }

    const referenceStorageObjectId =
      employee.personalData?.profilePhotoStorageObjectId ?? employee.photoStorageObjectId ?? null;

    if (!referenceStorageObjectId) {
      return null;
    }

    const signedUrl = await this.storageService.getPresignedUrl(
      referenceStorageObjectId,
      tenantId,
      FACIAL_REFERENCE_URL_TTL_SECONDS,
    );

    return {
      storageObjectId: referenceStorageObjectId,
      signedUrl,
      version: referenceStorageObjectId,
      updatedAt: employee.personalData?.updatedAt ?? employee.updatedAt,
    };
  }

  async miSede(userId: string, tenantId: string): Promise<SedeMarcacionConfigResult> {
    const employee = await this.repo.findEmployeeByUserId(userId, tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const location = await this.repo.findLocationById(employee.locationId, tenantId);
    if (!location) {
      throw new NotFoundException(`Sede ${employee.locationId} no encontrada`);
    }

    return this.toSedeMarcacionConfig(location);
  }

  // ── Pure helpers ────────────────────────────────────────────────────────────

  private toSedeMarcacionConfig(location: {
    id: string;
    name: string;
    geoLatitude: number | null;
    geoLongitude: number | null;
    checkInRadiusMeters: number | null;
  }): SedeMarcacionConfigResult {
    return {
      locationId: location.id,
      name: location.name,
      geoLatitude: location.geoLatitude,
      geoLongitude: location.geoLongitude,
      checkInRadiusMeters: location.checkInRadiusMeters,
      requiresPhoto: location.checkInRadiusMeters != null,
    };
  }

  private validateGeofence(
    clientLat: number,
    clientLng: number,
    sedeLat: number | null,
    sedeLng: number | null,
    radiusMeters: number | null,
  ): {
    status: MobileAttendanceStatus;
    distanceMeters: number | null;
    rejectionReason: string | null;
    radiusMeters: number | null;
  } {
    if (sedeLat == null || sedeLng == null || radiusMeters == null) {
      return {
        status: MobileAttendanceStatus.PENDING,
        distanceMeters: null,
        rejectionReason: null,
        radiusMeters: null,
      };
    }

    const dist = haversineDistanceMeters(clientLat, clientLng, sedeLat, sedeLng);

    if (dist > radiusMeters) {
      return {
        status: MobileAttendanceStatus.REJECTED,
        distanceMeters: dist,
        rejectionReason: 'OUTSIDE_RADIUS',
        radiusMeters,
      };
    }

    return {
      status: MobileAttendanceStatus.VALID,
      distanceMeters: dist,
      rejectionReason: null,
      radiusMeters,
    };
  }
}

// ── Pure function — no side effects ────────────────────────────────────────

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
