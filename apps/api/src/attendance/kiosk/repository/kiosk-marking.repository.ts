import { Injectable } from '@nestjs/common';
import {
  AttendanceEventType,
  AttendanceLogSource,
  ConsentType,
  type AttendanceLog,
  type EmployeeDetails,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { normalizeWorkDate } from '../../repository/attendance.repository';

export type KioskEmployeeRow = EmployeeDetails & {
  user: { id: string; cedula: string };
  personalData: { profilePhotoStorageObjectId: string | null; updatedAt: Date } | null;
};

@Injectable()
export class KioskMarkingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLocationById(locationId: string, tenantId: string) {
    return this.prisma.location.findFirst({
      where: { id: locationId, tenantId, isActive: true, deletedAt: null },
    });
  }

  findEmployeesAtLocation(locationId: string, tenantId: string): Promise<KioskEmployeeRow[]> {
    return this.prisma.employeeDetails.findMany({
      where: {
        locationId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, cedula: true } },
        personalData: {
          select: { profilePhotoStorageObjectId: true, updatedAt: true },
        },
      },
      orderBy: { name: 'asc' },
    }) as Promise<KioskEmployeeRow[]>;
  }

  /**
   * Empleados con asignación calendar del día cuyo turno pertenece a la sede
   * (cubre same-day / rotantes con malla en esa sede aunque ficha.locationId difiera).
   */
  async findEmployeeIdsWithAssignmentAtLocation(
    tenantId: string,
    locationId: string,
    workDate: Date,
  ): Promise<string[]> {
    const rows = await this.prisma.turnoAssignment.findMany({
      where: {
        tenantId,
        workDate,
        type: 'ASSIGNED',
        turnoId: { not: null },
        turno: { locationId },
      },
      select: { employeeId: true },
    });
    return [...new Set(rows.map((row) => row.employeeId))];
  }

  findEmployeesByIds(tenantId: string, employeeIds: string[]): Promise<KioskEmployeeRow[]> {
    if (employeeIds.length === 0) return Promise.resolve([]);
    return this.prisma.employeeDetails.findMany({
      where: {
        tenantId,
        id: { in: employeeIds },
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, cedula: true } },
        personalData: {
          select: { profilePhotoStorageObjectId: true, updatedAt: true },
        },
      },
      orderBy: { name: 'asc' },
    }) as Promise<KioskEmployeeRow[]>;
  }

  findEmployeeById(employeeId: string, tenantId: string): Promise<KioskEmployeeRow | null> {
    return this.prisma.employeeDetails.findFirst({
      where: { id: employeeId, tenantId, isActive: true, deletedAt: null },
      include: {
        user: { select: { id: true, cedula: true } },
        personalData: {
          select: { profilePhotoStorageObjectId: true, updatedAt: true },
        },
      },
    }) as Promise<KioskEmployeeRow | null>;
  }

  findOpenEntry(employeeId: string): Promise<AttendanceLog | null> {
    return this.prisma.attendanceLog
      .findFirst({
        where: {
          employeeId,
          eventType: AttendanceEventType.ENTRY,
          isActive: true,
          source: {
            in: [
              AttendanceLogSource.KIOSK,
              AttendanceLogSource.APP_MOVIL,
              AttendanceLogSource.DEVICE,
            ],
          },
        },
        orderBy: { timestamp: 'desc' },
      })
      .then(async (lastEntry) => {
        if (!lastEntry) return null;
        const exitAfter = await this.prisma.attendanceLog.findFirst({
          where: {
            employeeId,
            eventType: AttendanceEventType.EXIT,
            isActive: true,
            timestamp: { gte: lastEntry.timestamp },
          },
        });
        return exitAfter ? null : lastEntry;
      });
  }

  async hasActiveBiometricConsent(
    tenantId: string,
    employeeId: string,
    policyVersion: string,
  ): Promise<boolean> {
    const row = await this.prisma.dataConsent.findFirst({
      where: {
        tenantId,
        employeeId,
        policyVersion,
        consentType: ConsentType.BIOMETRICO_FACIAL,
        granted: true,
        revokedAt: null,
      },
    });
    return Boolean(row);
  }

  findActivePolicyVersion(tenantId: string): Promise<string | null> {
    return this.prisma.dataProcessingPolicy
      .findFirst({
        where: { tenantId, isActive: true },
        orderBy: { publishedAt: 'desc' },
        select: { version: true },
      })
      .then((row) => row?.version ?? null);
  }

  findKioskLogById(id: string, tenantId: string): Promise<AttendanceLog | null> {
    return this.prisma.attendanceLog.findFirst({
      where: { id, tenantId, source: AttendanceLogSource.KIOSK },
    });
  }

  deactivateLog(id: string, tenantId: string): Promise<AttendanceLog> {
    return this.prisma.attendanceLog
      .updateMany({
        where: { id, tenantId },
        data: { isActive: false },
      })
      .then(async (result) => {
        if (result.count === 0) {
          throw new Error(`AttendanceLog ${id} not found for tenant`);
        }
        const row = await this.prisma.attendanceLog.findFirst({ where: { id, tenantId } });
        if (!row) {
          throw new Error(`AttendanceLog ${id} not found after deactivate`);
        }
        return row;
      });
  }

  formatWorkDate(workDate: Date): string {
    const d = normalizeWorkDate(workDate);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
