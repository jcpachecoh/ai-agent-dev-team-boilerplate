import { Injectable, Logger } from '@nestjs/common';
import type { JornadaCutoff } from '@prisma/client';

import { computeShiftEndDateTime } from '../../overtime/utils/shift-end.util';
import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import type {
  CutoffCandidate,
  IJornadaCutoffService,
} from '../interfaces/jornada-cutoff.interfaces';
import { JORNADA_CUTOFF_NOTES } from '../interfaces/jornada-cutoff.interfaces';
import { JornadaCutoffRepository } from '../repository/jornada-cutoff.repository';

const LOOKBACK_DAYS = 2;

@Injectable()
export class JornadaCutoffService implements IJornadaCutoffService {
  private readonly logger = new Logger(JornadaCutoffService.name);

  constructor(
    private readonly repository: JornadaCutoffRepository,
    private readonly shiftResolutionService: ShiftResolutionService,
  ) {}

  async getCutoff(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<JornadaCutoff | null> {
    return this.repository.findByEmployeeAndWorkDate(tenantId, employeeId, workDate);
  }

  async isBeforeCutoff(tenantId: string, employeeId: string, workDate: Date): Promise<boolean> {
    const cutoff = await this.getCutoff(tenantId, employeeId, workDate);
    return cutoff === null;
  }

  async findDueCutoffCandidates(tenantId: string, asOf: Date): Promise<CutoffCandidate[]> {
    const workDateFrom = this.subtractDays(asOf, LOOKBACK_DAYS);
    const openEntries = await this.repository.findOpenOrdinaryEntries(tenantId, workDateFrom);
    const candidates: CutoffCandidate[] = [];

    for (const entry of openEntries) {
      const existing = await this.repository.findByEmployeeAndWorkDate(
        tenantId,
        entry.employeeId,
        entry.workDate,
      );
      if (existing) continue;

      const resolved = await this.shiftResolutionService.resolveForDay({
        tenantId,
        employeeId: entry.employeeId,
        locationId: entry.locationId,
        workDate: entry.workDate,
      });
      if (resolved.kind !== 'ASSIGNED') continue;

      const shiftEndTime = computeShiftEndDateTime(
        entry.workDate,
        resolved.turno.horaInicio,
        resolved.turno.horaFin,
      );
      if (asOf.getTime() < shiftEndTime.getTime()) continue;

      candidates.push({
        tenantId: entry.tenantId,
        employeeId: entry.employeeId,
        locationId: entry.locationId,
        workDate: entry.workDate,
        entryLogId: entry.id,
        shiftEndTime,
      });
    }

    return candidates;
  }

  async executeCutoffIfDue(candidate: CutoffCandidate, asOf: Date): Promise<JornadaCutoff | null> {
    if (asOf.getTime() < candidate.shiftEndTime.getTime()) {
      return null;
    }

    const existing = await this.repository.findByEmployeeAndWorkDate(
      candidate.tenantId,
      candidate.employeeId,
      candidate.workDate,
    );
    if (existing) return null;

    const openEntries = await this.repository.findOpenOrdinaryEntries(
      candidate.tenantId,
      candidate.workDate,
    );
    const openEntry = openEntries.find(
      (entry) =>
        entry.employeeId === candidate.employeeId &&
        entry.workDate.getTime() === candidate.workDate.getTime(),
    );

    let exitLogId: string | null = null;
    if (openEntry) {
      const exitLog = await this.repository.createSystemExitLog({
        tenantId: candidate.tenantId,
        employeeId: candidate.employeeId,
        locationId: candidate.locationId,
        workDate: candidate.workDate,
        timestamp: candidate.shiftEndTime,
        shift: openEntry.shift,
        notes: JORNADA_CUTOFF_NOTES,
      });
      exitLogId = exitLog.id;
    }

    const cutoff = await this.repository.create({
      tenantId: candidate.tenantId,
      employeeId: candidate.employeeId,
      locationId: candidate.locationId,
      workDate: candidate.workDate,
      shiftEndTime: candidate.shiftEndTime,
      cutoffAt: asOf,
      entryLogId: openEntry?.id ?? candidate.entryLogId,
      exitLogId,
    });

    this.logger.log(
      `Jornada cutoff employee=${candidate.employeeId} workDate=${candidate.workDate.toISOString()} exitLogId=${exitLogId ?? 'none'}`,
    );

    return cutoff;
  }

  async runDueCutoffsForTenant(tenantId: string, asOf: Date): Promise<number> {
    const candidates = await this.findDueCutoffCandidates(tenantId, asOf);
    let processed = 0;

    for (const candidate of candidates) {
      try {
        const result = await this.executeCutoffIfDue(candidate, asOf);
        if (result) processed += 1;
      } catch (error: unknown) {
        this.logger.warn(
          `Jornada cutoff failed tenant=${tenantId} employee=${candidate.employeeId}: ${String(error)}`,
        );
      }
    }

    return processed;
  }

  private subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() - days);
    return result;
  }
}
