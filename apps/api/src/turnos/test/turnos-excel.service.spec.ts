import { Test, TestingModule } from '@nestjs/testing';
import { TurnoJornada, TurnoTipo } from '@prisma/client';

import type { TurnoRecord } from '../interfaces/turnos.interfaces';
import { TurnosExcelService } from '../service/turnos-excel.service';

function isXlsxBuffer(buf: Buffer): boolean {
  return buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

const baseTurno: TurnoRecord = {
  id: 'turno-1',
  tenantId: 'tenant-1',
  nombre: 'Turno mañana',
  sigla: 'TM',
  tipo: TurnoTipo.PERMANENTE,
  jornada: TurnoJornada.DIURNO,
  horaInicio: '06:00',
  horaFin: '14:00',
  estado: true,
  createdByUserId: 'user-1',
  updatedByUserId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TurnosExcelService', () => {
  let service: TurnosExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TurnosExcelService],
    }).compile();

    service = module.get(TurnosExcelService);
  });

  it('genera buffer XLSX válido con lista vacía', async () => {
    const result = await service.generateTurnosXlsx([]);

    expect(result).toBeInstanceOf(Buffer);
    expect(isXlsxBuffer(result)).toBe(true);
  });

  it('genera buffer XLSX con turnos activos e inactivos', async () => {
    const turnos: TurnoRecord[] = [
      baseTurno,
      { ...baseTurno, id: 'turno-2', nombre: 'Turno noche', sigla: 'TN', estado: false },
    ];

    const result = await service.generateTurnosXlsx(turnos);

    expect(result.length).toBeGreaterThan(0);
    expect(isXlsxBuffer(result)).toBe(true);
  });
});
