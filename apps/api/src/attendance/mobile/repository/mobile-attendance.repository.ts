import { Injectable } from '@nestjs/common';
import type {
  EmployeeDetails,
  Location,
  MobileAttendanceLog,
  MobileAttendanceStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateMobileAttendanceData,
  EmployeeWithFacialReference,
  IMobileAttendanceRepository,
  MarcacionConnection,
} from '../interfaces/mobile-attendance.interfaces';

const LOCATION_SELECT = {
  id: true,
  name: true,
  geoLatitude: true,
  geoLongitude: true,
  checkInRadiusMeters: true,
} as const;

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

  create(data: CreateMobileAttendanceData): Promise<MobileAttendanceLog> {
    return this.prisma.mobileAttendanceLog.create({ data });
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
        deletedAt: null,
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
      status?: MobileAttendanceStatus | null;
      cursor?: string;
      take: number;
    },
  ): Promise<MarcacionConnection> {
    return this.paginatedQuery(
      {
        tenantId,
        locationId,
        deletedAt: null,
        workDate: { gte: filters.dateFrom, lte: filters.dateTo },
        ...(filters.status ? { status: filters.status } : {}),
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
      status?: MobileAttendanceStatus | null;
      cursor?: string;
      take: number;
    },
  ): Promise<MarcacionConnection> {
    return this.paginatedQuery(
      {
        tenantId,
        employeeId,
        deletedAt: null,
        workDate: { gte: filters.dateFrom, lte: filters.dateTo },
        ...(filters.status ? { status: filters.status } : {}),
      },
      filters,
    );
  }

  private async paginatedQuery(
    where: Record<string, unknown>,
    filters: { cursor?: string; take: number },
  ): Promise<MarcacionConnection> {
    const items = await this.prisma.mobileAttendanceLog.findMany({
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

    return { edges, pageInfo: { hasNextPage, endCursor } };
  }
}
