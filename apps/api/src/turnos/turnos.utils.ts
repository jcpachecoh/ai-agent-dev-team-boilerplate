import type { TurnoRecord } from './interfaces/turnos.interfaces';

export function toTurnoAuditJson(turno: TurnoRecord): Record<string, unknown> {
  return {
    nombre: turno.nombre,
    sigla: turno.sigla,
    tipo: turno.tipo,
    jornada: turno.jornada,
    horaInicio: turno.horaInicio,
    horaFin: turno.horaFin,
    estado: turno.estado,
  };
}

export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
