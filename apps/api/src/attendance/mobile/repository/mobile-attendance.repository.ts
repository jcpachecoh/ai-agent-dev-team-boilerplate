import { Injectable } from '@nestjs/common';
import type { EmployeeDetails, Location } from '@prisma/client';
import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceValidationStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  EmployeeWithFacialReference,
  IMobileAttendanceRepository,
  MarcacionConnection,
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

  async findByEmployeeId(
    employeeId: string,
    tenantId: string,
    filters: { dateFrom?: Date; dateTo?: Date; cursor?: string; take: number },
  ): Promise<MarcacionConnection> {
    return this.paginatedQuery(
      {
        tenantId,
        employeeId,
        source: AttendanceLogSource.APP_MOVIL,
        isActive: true,
        ...(filters.dateFrom || filters.dateTo
          ? {
              workDate: {
                ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
                ...(filters.dateTo ? { lte: filters.dateTo } : {}),
              },
            }
          : {}),
      },
      filters,
    );
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
    return this.paginatedQuery(
      {
        tenantId,
        locationId,
        source: AttendanceLogSource.APP_MOVIL,
        isActive: true,
        workDate: { gte: filters.dateFrom, lte: filters.dateTo },
        ...(filters.status ? { validationStatus: filters.status } : {}),
      },
      filters,
    );
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
    return this.paginatedQuery(
      {
        tenantId,
        employeeId,
        source: AttendanceLogSource.APP_MOVIL,
        isActive: true,
        workDate: { gte: filters.dateFrom, lte: filters.dateTo },
        ...(filters.status ? { validationStatus: filters.status } : {}),
      },
      filters,
    );
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
