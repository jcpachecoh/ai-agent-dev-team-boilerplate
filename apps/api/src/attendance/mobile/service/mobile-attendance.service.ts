import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceValidationStatus,
  ConsentType,
  StorageDomain,
} from '@prisma/client';
import { StorageService } from '../../../storage/service/storage.service';
import { DataConsentService } from '../../../data-consent/service/data-consent.service';
import { AttendanceService } from '../../service/attendance.service';
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
    private readonly attendanceService: AttendanceService,
    private readonly dataConsentService: DataConsentService,
  ) {}

  async registrarMarcacion(
    input: RegistrarMarcacionInput,
    userId: string,
    tenantId: string,
  ): Promise<MarcacionResult> {
    const employee = await this.repo.findEmployeeByUserId(userId, tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado para este tenant');
    }
    if (!employee.isActive) {
      throw new ForbiddenException('Empleado inactivo');
    }

    const location = await this.repo.findLocationById(input.locationId, tenantId);
    if (!location) {
      throw new NotFoundException(`Sede ${input.locationId} no encontrada`);
    }

    if (employee.locationId !== input.locationId) {
      throw new ForbiddenException('El empleado no está asignado a esta sede');
    }

    await this.dataConsentService.assertConsentForFeature({
      userId,
      tenantId,
      consentType: ConsentType.GEOLOCALIZACION,
    });

    const usesFacialEvidence =
      Boolean(input.storageObjectId) ||
      input.facialMatchScore != null ||
      Boolean(input.facialMatchResult);
    if (usesFacialEvidence) {
      await this.dataConsentService.assertConsentForFeature({
        userId,
        tenantId,
        consentType: ConsentType.BIOMETRICO_FACIAL,
      });
    }

    const now = new Date();
    const timestamp = input.timestamp ?? now;
    if (Math.abs(timestamp.getTime() - now.getTime()) > MAX_TIMESTAMP_DRIFT_MS) {
      throw new BadRequestException('Timestamp demasiado desfasado (máximo 5 minutos)');
    }

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

    const log = await this.attendanceService.registerEvent({
      tenantId,
      employeeId: employee.id,
      locationId: input.locationId,
      eventType: input.eventType as AttendanceEventType,
      source: AttendanceLogSource.APP_MOVIL,
      timestamp,
      notes: input.notes ?? null,
      clientLatitude: input.clientLatitude,
      clientLongitude: input.clientLongitude,
      storageObjectId: input.storageObjectId ?? null,
      photoUrl,
      facialMatchScore: input.facialMatchScore ?? null,
      facialMatchResult: input.facialMatchResult ?? null,
      markingScope: input.markingScope,
    });

    const status = log.validationStatus ?? AttendanceValidationStatus.PENDING;

    this.logger.log(
      `MOBILE ${input.eventType}: employeeId=${employee.id} locationId=${input.locationId} status=${status} dist=${log.distanceMeters?.toFixed(0) ?? 'n/a'}m`,
    );

    return {
      id: log.id,
      status,
      distanceMeters: log.distanceMeters,
      rejectionReason: log.rejectionReason,
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

    return this.repo.findMany({
      tenantId,
      employeeId: employee.id,
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
}

// Re-export for tests that import haversine from this module.
export { haversineDistanceMeters } from '../../utils/attendance-geofence.util';
