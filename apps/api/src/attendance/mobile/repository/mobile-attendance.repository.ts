import { Injectable } from '@nestjs/common';
import type { AttendanceLog, EmployeeDetails, Location } from '@prisma/client';
import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceValidationStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateMobileAttendanceLogData,
  EmployeeWithFacialReference,
  IMobileAttendanceRepository,
  MarcacionConnection,
  MobileAttendanceFindManyFilters,
  MobileAttendanceLogFull,
} from '../interfaces/mobile-attendance.interfaces';

const LOCATION_SELECT = {
  id: true,
  name: true,
  geoLatitude: true,
  geoLongitude: true,
  checkInRadiusMeters: true,
} as const;

function mapLogRow(log: {
  id: string;
  tenantId: string;
  employeeId: string;
  locationId: string;
  eventType: AttendanceEventType;
  validationStatus: AttendanceValidationStatus | null;
  timestamp: Date;
  workDate: Date;
  distanceMeters: number | null;
  photoUrl: string | null;
  facialMatchScore: number | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: Date;
  employee: EmployeeDetails;
  location: {
    id: string;
    name: string;
    geoLatitude: number | null;
    geoLongitude: number | null;
    checkInRadiusMeters: number | null;
  };
}): MobileAttendanceLogFull {
  return {
    id: log.id,
    tenantId: log.tenantId,
    employeeId: log.employeeId,
    locationId: log.locationId,
    eventType: log.eventType,
    status: log.validationStatus ?? AttendanceValidationStatus.PENDING,
    timestamp: log.timestamp,
    workDate: log.workDate,
    distanceMeters: log.distanceMeters,
    photoUrl: log.photoUrl,
    facialMatchScore: log.facialMatchScore,
    rejectionReason: log.rejectionReason,
    notes: log.notes,
    createdAt: log.createdAt,
    employee: log.employee,
    location: log.location,
  };
}

@Injectable()
export class MobileAttendanceRepository implements IMobileAttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMobileAttendanceLogData): Promise<AttendanceLog> {
    return this.prisma.attendanceLog.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        locationId: data.locationId,
        eventType: data.eventType,
        shift: data.shift ?? null,
        workDate: data.workDate,
        timestamp: data.timestamp,
        notes: data.notes ?? null,
        source: AttendanceLogSource.APP_MOVIL,
        validationStatus: data.validationStatus ?? null,
        clientLatitude: data.clientLatitude ?? null,
        clientLongitude: data.clientLongitude ?? null,
        distanceMeters: data.distanceMeters ?? null,
        radiusMeters: data.radiusMeters ?? null,
        storageObjectId: data.storageObjectId ?? null,
        photoUrl: data.photoUrl ?? null,
        facialMatchScore: data.facialMatchScore ?? null,
        facialMatchResult: data.facialMatchResult ?? null,
        rejectionReason: data.rejectionReason ?? null,
      },
    });
  }

  findEmployeeByUserId(userId: string, tenantId: string): Promise<EmployeeDetails | null> {
    return this.prisma.employeeDetails.findFirst({
      where: { userId, tenantId, deletedAt: null },
    });
  }

  findEmployeeWithFacialReference(
    userId: string,
    tenantId: string,
  ): Promise<EmployeeWithFacialReference | null> {
    return this.prisma.employeeDetails.findFirst({
      where: { userId, tenantId, deletedAt: null },
      include: {
        personalData: {
          select: {
            profilePhotoStorageObjectId: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  findLocationById(locationId: string, tenantId: string): Promise<Location | null> {
    return this.prisma.location.findFirst({
      where: { id: locationId, tenantId, deletedAt: null, isActive: true },
    });
  }

  async findMany(filters: MobileAttendanceFindManyFilters): Promise<MarcacionConnection> {
    return this.paginatedQuery(
      {
        tenantId: filters.tenantId,
        source: AttendanceLogSource.APP_MOVIL,
        isActive: true,
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.locationId ? { locationId: filters.locationId } : {}),
        ...(filters.status ? { validationStatus: filters.status } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              workDate: {
                ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
                ...(filters.dateTo ? { lte: filters.dateTo } : {}),
              },
            }
          : {}),
      },
      { cursor: filters.cursor, take: filters.take },
    );
  }

  async findByEmployeeId(
    employeeId: string,
    tenantId: string,
    filters: { dateFrom?: Date; dateTo?: Date; cursor?: string; take: number },
  ): Promise<MarcacionConnection> {
    return this.findMany({
      tenantId,
      employeeId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      cursor: filters.cursor,
      take: filters.take,
    });
  }

  async findByLocationId(
    locationId: string,
    tenantId: string,
    filters: {
      dateFrom: Date;
      dateTo: Date;
      status?: AttendanceValidationStatus | null;
      cursor?: string;
      take: number;
    },
  ): Promise<MarcacionConnection> {
    return this.findMany({
      tenantId,
      locationId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      status: filters.status,
      cursor: filters.cursor,
      take: filters.take,
    });
  }

  async findByEmployeeIdAdmin(
    employeeId: string,
    tenantId: string,
    filters: {
      dateFrom: Date;
      dateTo: Date;
      status?: AttendanceValidationStatus | null;
      cursor?: string;
      take: number;
    },
  ): Promise<MarcacionConnection> {
    return this.findMany({
      tenantId,
      employeeId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      status: filters.status,
      cursor: filters.cursor,
      take: filters.take,
    });
  }

  private async paginatedQuery(
    where: Record<string, unknown>,
    filters: { cursor?: string; take: number },
  ): Promise<MarcacionConnection> {
    const items = await this.prisma.attendanceLog.findMany({
      where,
      take: filters.take + 1,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      orderBy: { timestamp: 'desc' },
      include: {
        employee: true,
        location: { select: LOCATION_SELECT },
      },
    });

    const hasNextPage = items.length > filters.take;
    const edges = hasNextPage ? items.slice(0, -1) : items;
    const endCursor = edges.at(-1)?.id ?? null;

    return {
      edges: edges.map((log) => mapLogRow(log)),
      pageInfo: { hasNextPage, endCursor },
    };
  }
}
