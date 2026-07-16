import { Injectable } from '@nestjs/common';
import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceMarkingScope,
  type AttendanceShift,
  type JornadaCutoff,
  JornadaCutoffType,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateJornadaCutoffData,
  IJornadaCutoffRepository,
} from '../interfaces/jornada-cutoff.interfaces';

@Injectable()
export class JornadaCutoffRepository implements IJornadaCutoffRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmployeeAndWorkDate(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<JornadaCutoff | null> {
    return this.prisma.jornadaCutoff.findUnique({
      where: {
        tenantId_employeeId_workDate: {
          tenantId,
          employeeId,
          workDate,
        },
      },
    });
  }

  create(data: CreateJornadaCutoffData): Promise<JornadaCutoff> {
    return this.prisma.jornadaCutoff.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        locationId: data.locationId,
        workDate: data.workDate,
        shiftEndTime: data.shiftEndTime,
        cutoffAt: data.cutoffAt,
        cutoffType: JornadaCutoffType.AUTOMATIC,
        entryLogId: data.entryLogId,
        exitLogId: data.exitLogId,
      },
    });
  }

  async findOpenOrdinaryEntries(
    tenantId: string,
    workDateFrom: Date,
  ): Promise<
    Array<{
      id: string;
      tenantId: string;
      employeeId: string;
      locationId: string;
      workDate: Date;
      timestamp: Date;
      shift: string | null;
    }>
  > {
    const entries = await this.prisma.attendanceLog.findMany({
      where: {
        tenantId,
        eventType: AttendanceEventType.ENTRY,
        markingScope: AttendanceMarkingScope.ORDINARY,
        isActive: true,
        workDate: { gte: workDateFrom },
      },
      orderBy: [{ employeeId: 'asc' }, { workDate: 'asc' }, { timestamp: 'asc' }],
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        locationId: true,
        workDate: true,
        timestamp: true,
        shift: true,
      },
    });

    const openEntries: typeof entries = [];
    for (const entry of entries) {
      const exit = await this.prisma.attendanceLog.findFirst({
        where: {
          tenantId,
          employeeId: entry.employeeId,
          workDate: entry.workDate,
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.ORDINARY,
          isActive: true,
          timestamp: { gt: entry.timestamp },
        },
        select: { id: true },
      });
      if (!exit) {
        openEntries.push(entry);
      }
    }

    return openEntries.map((entry) => ({
      ...entry,
      shift: entry.shift ?? null,
    }));
  }

  async createSystemExitLog(data: {
    tenantId: string;
    employeeId: string;
    locationId: string;
    workDate: Date;
    timestamp: Date;
    shift: string | null;
    notes: string;
  }): Promise<{ id: string }> {
    const log = await this.prisma.attendanceLog.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        locationId: data.locationId,
        eventType: AttendanceEventType.EXIT,
        workDate: data.workDate,
        timestamp: data.timestamp,
        notes: data.notes,
        source: AttendanceLogSource.SYSTEM,
        markingScope: AttendanceMarkingScope.ORDINARY,
        shift: (data.shift as AttendanceShift | null) ?? null,
      },
      select: { id: true },
    });
    return log;
  }
}
