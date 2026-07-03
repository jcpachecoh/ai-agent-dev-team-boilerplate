import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  CreateTurnoData,
  ITurnosService,
  ListTurnosFilters,
  ListTurnosOptions,
  TurnoRecord,
  TurnosListResult,
  UpdateTurnoData,
} from '../interfaces/turnos.interfaces';
import { TurnosRepository } from '../repository/turnos.repository';
import { HH_MM_REGEX } from '../turnos.constants';
import { startOfTodayUtc } from '../turnos.utils';
import { TurnosExcelService } from './turnos-excel.service';

@Injectable()
export class TurnosService implements ITurnosService {
  constructor(
    private readonly turnosRepository: TurnosRepository,
    private readonly turnosExcelService: TurnosExcelService,
  ) {}

  async findAll(tenantId: string, options: ListTurnosOptions): Promise<TurnosListResult> {
    return this.turnosRepository.findMany(tenantId, options);
  }

  async create(tenantId: string, data: CreateTurnoData, actorUserId: string): Promise<TurnoRecord> {
    this.validateTurnoPayload(data);

    const existing = await this.turnosRepository.findBySigla(tenantId, data.sigla);
    if (existing) {
      throw new ConflictException('Ya existe un turno con esta sigla');
    }

    try {
      return await this.turnosRepository.createWithAudit(tenantId, data, actorUserId, {
        nombre: data.nombre,
        sigla: data.sigla,
        tipo: data.tipo,
        jornada: data.jornada,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        estado: true,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un turno con esta sigla');
      }
      throw error;
    }
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateTurnoData,
    actorUserId: string,
  ): Promise<TurnoRecord> {
    this.validateTurnoPayload(data);

    const current = await this.turnosRepository.findById(tenantId, id);
    if (!current) {
      throw new NotFoundException(`Turno "${id}" no encontrado`);
    }

    if (data.sigla !== current.sigla) {
      const existing = await this.turnosRepository.findBySigla(tenantId, data.sigla);
      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe un turno con esta sigla');
      }
    }

    const auditChanges = this.buildFieldDiff(current, data);

    try {
      return await this.turnosRepository.updateWithAudit(
        tenantId,
        id,
        data,
        actorUserId,
        auditChanges,
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Ya existe un turno con esta sigla');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`Turno "${id}" no encontrado`);
        }
      }
      throw error;
    }
  }

  async updateEstado(
    tenantId: string,
    id: string,
    estado: boolean,
    actorUserId: string,
  ): Promise<TurnoRecord> {
    const current = await this.turnosRepository.findById(tenantId, id);
    if (!current) {
      throw new NotFoundException(`Turno "${id}" no encontrado`);
    }

    if (current.estado === estado) {
      return current;
    }

    if (!estado) {
      const affectedCount = await this.turnosRepository.countFutureAssignments(
        tenantId,
        id,
        startOfTodayUtc(),
      );
      if (affectedCount > 0) {
        throw new ConflictException({
          message: 'No se puede desactivar el turno: hay colaboradores asignados en fechas futuras',
          affectedCount,
        });
      }
    }

    return this.turnosRepository.updateEstadoWithAudit(tenantId, id, estado, actorUserId, {
      oldValue: { estado: current.estado },
      newValue: { estado },
    });
  }

  async exportExcel(
    tenantId: string,
    filters: ListTurnosFilters,
    actorUserId: string,
  ): Promise<Buffer | null> {
    const turnos = await this.turnosRepository.findAllFiltered(tenantId, filters);
    if (turnos.length === 0) {
      return null;
    }

    const buffer = await this.turnosExcelService.generateTurnosXlsx(turnos);
    await this.turnosRepository.logExportAudit(tenantId, actorUserId, {
      filters,
      rowCount: turnos.length,
    });
    return buffer;
  }

  private validateTurnoPayload(data: CreateTurnoData): void {
    if (!data.nombre?.trim()) {
      throw new BadRequestException('El nombre es obligatorio');
    }
    if (!data.sigla?.trim()) {
      throw new BadRequestException('La sigla es obligatoria');
    }
    if (data.sigla.length > 30) {
      throw new BadRequestException('La sigla no puede superar 30 caracteres');
    }
    if (!HH_MM_REGEX.test(data.horaInicio)) {
      throw new BadRequestException('horaInicio debe tener formato HH:mm');
    }
    if (!HH_MM_REGEX.test(data.horaFin)) {
      throw new BadRequestException('horaFin debe tener formato HH:mm');
    }
    if (data.horaInicio === data.horaFin) {
      throw new BadRequestException('horaInicio y horaFin no pueden ser iguales');
    }
  }

  private buildFieldDiff(
    current: TurnoRecord,
    data: UpdateTurnoData,
  ): { oldValue: Record<string, unknown>; newValue: Record<string, unknown> } {
    const oldValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};
    const keys: (keyof UpdateTurnoData)[] = [
      'nombre',
      'sigla',
      'tipo',
      'jornada',
      'horaInicio',
      'horaFin',
    ];

    for (const key of keys) {
      if (data[key] !== current[key]) {
        oldValue[key] = current[key];
        newValue[key] = data[key];
      }
    }

    return { oldValue, newValue };
  }
}
