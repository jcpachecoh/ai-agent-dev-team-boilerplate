import type { JornadaCutoff } from '@prisma/client';

export interface CutoffCandidate {
  tenantId: string;
  employeeId: string;
  locationId: string;
  workDate: Date;
  entryLogId: string;
  shiftEndTime: Date;
}

export interface CreateJornadaCutoffData {
  tenantId: string;
  employeeId: string;
  locationId: string;
  workDate: Date;
  shiftEndTime: Date;
  cutoffAt: Date;
  entryLogId: string | null;
  exitLogId: string | null;
}

export interface IJornadaCutoffRepository {
  findByEmployeeAndWorkDate(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<JornadaCutoff | null>;

  create(data: CreateJornadaCutoffData): Promise<JornadaCutoff>;

  findOpenOrdinaryEntries(
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
  >;

  createSystemExitLog(data: {
    tenantId: string;
    employeeId: string;
    locationId: string;
    workDate: Date;
    timestamp: Date;
    shift: string | null;
    notes: string;
  }): Promise<{ id: string }>;
}

export interface IJornadaCutoffService {
  executeCutoffIfDue(candidate: CutoffCandidate, asOf: Date): Promise<JornadaCutoff | null>;

  findDueCutoffCandidates(tenantId: string, asOf: Date): Promise<CutoffCandidate[]>;

  isBeforeCutoff(tenantId: string, employeeId: string, workDate: Date): Promise<boolean>;

  getCutoff(tenantId: string, employeeId: string, workDate: Date): Promise<JornadaCutoff | null>;

  runDueCutoffsForTenant(tenantId: string, asOf: Date): Promise<number>;
}

export const JORNADA_CUTOFF_NOTES = 'Corte automático de jornada (CONN-11)';
