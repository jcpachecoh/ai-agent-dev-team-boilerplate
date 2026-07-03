import type { TurnoJornada, TurnoTipo } from '@prisma/client';

export interface TurnoRecord {
  id: string;
  tenantId: string;
  nombre: string;
  sigla: string;
  tipo: TurnoTipo;
  jornada: TurnoJornada;
  horaInicio: string;
  horaFin: string;
  estado: boolean;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTurnosFilters {
  estado?: boolean;
  search?: string;
  nombre?: string;
  sigla?: string;
  tipo?: TurnoTipo;
  jornada?: TurnoJornada;
}

export interface ListTurnosOptions extends ListTurnosFilters {
  page?: number;
  limit?: number;
}

export interface TurnosPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TurnosListResult {
  data: TurnoRecord[];
  pagination: TurnosPagination;
}

export interface CreateTurnoData {
  nombre: string;
  sigla: string;
  tipo: TurnoTipo;
  jornada: TurnoJornada;
  horaInicio: string;
  horaFin: string;
}

export type UpdateTurnoData = CreateTurnoData;

export interface AuditChangeSet {
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
}

export interface ITurnosRepository {
  findMany(tenantId: string, options: ListTurnosOptions): Promise<TurnosListResult>;
  findAllFiltered(tenantId: string, filters: ListTurnosFilters): Promise<TurnoRecord[]>;
  findById(tenantId: string, id: string): Promise<TurnoRecord | null>;
  findBySigla(tenantId: string, sigla: string): Promise<TurnoRecord | null>;
  countFutureAssignments(tenantId: string, turnoId: string, fromDate: Date): Promise<number>;
  createWithAudit(
    tenantId: string,
    data: CreateTurnoData,
    actorUserId: string,
    auditNewValue: Record<string, unknown>,
  ): Promise<TurnoRecord>;
  updateWithAudit(
    tenantId: string,
    id: string,
    data: UpdateTurnoData,
    actorUserId: string,
    auditChanges: AuditChangeSet,
  ): Promise<TurnoRecord>;
  updateEstadoWithAudit(
    tenantId: string,
    id: string,
    estado: boolean,
    actorUserId: string,
    auditChanges: AuditChangeSet,
  ): Promise<TurnoRecord>;
  logExportAudit(
    tenantId: string,
    actorUserId: string,
    payload: Record<string, unknown>,
  ): Promise<void>;
}

export interface ITurnosService {
  findAll(tenantId: string, options: ListTurnosOptions): Promise<TurnosListResult>;
  create(tenantId: string, data: CreateTurnoData, actorUserId: string): Promise<TurnoRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdateTurnoData,
    actorUserId: string,
  ): Promise<TurnoRecord>;
  updateEstado(
    tenantId: string,
    id: string,
    estado: boolean,
    actorUserId: string,
  ): Promise<TurnoRecord>;
  exportExcel(
    tenantId: string,
    filters: ListTurnosFilters,
    actorUserId: string,
  ): Promise<Buffer | null>;
}
