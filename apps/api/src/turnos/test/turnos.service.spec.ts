import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, TurnoJornada, TurnoTipo } from '@prisma/client';
import { TurnosRepository } from '../repository/turnos.repository';
import { TurnosExcelService } from '../service/turnos-excel.service';
import { TurnosService } from '../service/turnos.service';

describe('TurnosService', () => {
  let service: TurnosService;
  let repository: jest.Mocked<TurnosRepository>;
  let excelService: jest.Mocked<TurnosExcelService>;

  const tenantId = 'tenant-1';
  const actorUserId = 'user-1';
  const baseTurno = {
    id: 'turno-1',
    tenantId,
    locationId: 'loc-1',
    nombre: 'Turno mañana',
    sigla: 'TM',
    tipo: TurnoTipo.PERMANENTE,
    jornada: TurnoJornada.DIURNO,
    horaInicio: '06:00',
    horaFin: '14:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    estado: true,
    createdByUserId: actorUserId,
    updatedByUserId: actorUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validPayload = {
    locationId: 'loc-1',
    nombre: 'Turno mañana',
    sigla: 'TM',
    tipo: TurnoTipo.PERMANENTE,
    jornada: TurnoJornada.DIURNO,
    horaInicio: '06:00',
    horaFin: '14:00',
    daysOfWeek: [1, 2, 3, 4, 5],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnosService,
        {
          provide: TurnosRepository,
          useValue: {
            findMany: jest.fn(),
            findAllFiltered: jest.fn(),
            findById: jest.fn(),
            findBySigla: jest.fn(),
            countFutureAssignments: jest.fn(),
            createWithAudit: jest.fn(),
            updateWithAudit: jest.fn(),
            updateEstadoWithAudit: jest.fn(),
            logExportAudit: jest.fn(),
          },
        },
        {
          provide: TurnosExcelService,
          useValue: {
            generateTurnosXlsx: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TurnosService);
    repository = module.get(TurnosRepository);
    excelService = module.get(TurnosExcelService);
  });

  describe('findAll', () => {
    it('delegates listado al repository con tenantId', async () => {
      repository.findMany.mockResolvedValue({
        data: [baseTurno],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await service.findAll(tenantId, { page: 1, limit: 20 });

      expect(repository.findMany).toHaveBeenCalledWith(tenantId, { page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('crea turno en happy path', async () => {
      repository.findBySigla.mockResolvedValue(null);
      repository.createWithAudit.mockResolvedValue(baseTurno);

      const result = await service.create(tenantId, validPayload, actorUserId);

      expect(repository.createWithAudit).toHaveBeenCalled();
      expect(result.id).toBe('turno-1');
    });

    it('lanza 409 si sigla duplicada', async () => {
      repository.findBySigla.mockResolvedValue(baseTurno);

      await expect(service.create(tenantId, validPayload, actorUserId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza 400 si horaInicio y horaFin son iguales', async () => {
      await expect(
        service.create(
          tenantId,
          { ...validPayload, horaInicio: '08:00', horaFin: '08:00' },
          actorUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza 400 si nombre está vacío', async () => {
      await expect(
        service.create(tenantId, { ...validPayload, nombre: '   ' }, actorUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza 400 si sigla está vacía', async () => {
      await expect(
        service.create(tenantId, { ...validPayload, sigla: '' }, actorUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza 400 si sigla supera 30 caracteres', async () => {
      await expect(
        service.create(tenantId, { ...validPayload, sigla: 'A'.repeat(31) }, actorUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza 400 si horaInicio tiene formato inválido', async () => {
      await expect(
        service.create(tenantId, { ...validPayload, horaInicio: '25:00' }, actorUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza 400 si horaFin tiene formato inválido', async () => {
      await expect(
        service.create(tenantId, { ...validPayload, horaFin: '8:00' }, actorUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza 409 si prisma devuelve P2002 en create', async () => {
      repository.findBySigla.mockResolvedValue(null);
      repository.createWithAudit.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );

      await expect(service.create(tenantId, validPayload, actorUserId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('relanza errores desconocidos en create', async () => {
      repository.findBySigla.mockResolvedValue(null);
      repository.createWithAudit.mockRejectedValue(new Error('db down'));

      await expect(service.create(tenantId, validPayload, actorUserId)).rejects.toThrow('db down');
    });
  });

  describe('update', () => {
    it('lanza 404 si turno no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update(tenantId, 'missing', validPayload, actorUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('envía solo campos modificados al audit', async () => {
      repository.findById.mockResolvedValue(baseTurno);
      repository.findBySigla.mockResolvedValue(null);
      repository.updateWithAudit.mockResolvedValue({ ...baseTurno, nombre: 'Turno tarde' });

      await service.update(
        tenantId,
        'turno-1',
        { ...validPayload, nombre: 'Turno tarde' },
        actorUserId,
      );

      expect(repository.updateWithAudit).toHaveBeenCalledWith(
        tenantId,
        'turno-1',
        expect.objectContaining({ nombre: 'Turno tarde' }),
        actorUserId,
        {
          oldValue: { nombre: 'Turno mañana' },
          newValue: { nombre: 'Turno tarde' },
        },
      );
    });

    it('lanza 409 si la sigla ya pertenece a otro turno', async () => {
      repository.findById.mockResolvedValue(baseTurno);
      repository.findBySigla.mockResolvedValue({ ...baseTurno, id: 'turno-2', sigla: 'TN' });

      await expect(
        service.update(tenantId, 'turno-1', { ...validPayload, sigla: 'TN' }, actorUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('no valida sigla duplicada si la sigla no cambió', async () => {
      repository.findById.mockResolvedValue(baseTurno);
      repository.updateWithAudit.mockResolvedValue(baseTurno);

      await service.update(tenantId, 'turno-1', validPayload, actorUserId);

      expect(repository.findBySigla).not.toHaveBeenCalled();
    });

    it('lanza 409 si prisma devuelve P2002 en update', async () => {
      repository.findById.mockResolvedValue(baseTurno);
      repository.updateWithAudit.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );

      await expect(service.update(tenantId, 'turno-1', validPayload, actorUserId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza 404 si prisma devuelve P2025 en update', async () => {
      repository.findById.mockResolvedValue(baseTurno);
      repository.updateWithAudit.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('not found', {
          code: 'P2025',
          clientVersion: '5.0.0',
        }),
      );

      await expect(service.update(tenantId, 'turno-1', validPayload, actorUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateEstado', () => {
    it('lanza 404 si turno no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.updateEstado(tenantId, 'missing', false, actorUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna turno sin cambios si el estado ya es el solicitado', async () => {
      repository.findById.mockResolvedValue(baseTurno);

      const result = await service.updateEstado(tenantId, 'turno-1', true, actorUserId);

      expect(result).toEqual(baseTurno);
      expect(repository.updateEstadoWithAudit).not.toHaveBeenCalled();
    });

    it('lanza 409 con affectedCount si hay asignaciones futuras', async () => {
      repository.findById.mockResolvedValue(baseTurno);
      repository.countFutureAssignments.mockResolvedValue(3);

      await expect(
        service.updateEstado(tenantId, 'turno-1', false, actorUserId),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ affectedCount: 3 }),
      });
    });

    it('actualiza estado cuando no hay asignaciones futuras', async () => {
      repository.findById.mockResolvedValue(baseTurno);
      repository.countFutureAssignments.mockResolvedValue(0);
      repository.updateEstadoWithAudit.mockResolvedValue({ ...baseTurno, estado: false });

      const result = await service.updateEstado(tenantId, 'turno-1', false, actorUserId);

      expect(result.estado).toBe(false);
      expect(repository.updateEstadoWithAudit).toHaveBeenCalled();
    });
  });

  describe('exportExcel', () => {
    it('retorna null si no hay registros', async () => {
      repository.findAllFiltered.mockResolvedValue([]);

      const result = await service.exportExcel(tenantId, {}, actorUserId);

      expect(result).toBeNull();
      expect(excelService.generateTurnosXlsx).not.toHaveBeenCalled();
    });

    it('delega generación xlsx y registra audit', async () => {
      repository.findAllFiltered.mockResolvedValue([baseTurno]);
      excelService.generateTurnosXlsx.mockResolvedValue(Buffer.from('xlsx'));

      const result = await service.exportExcel(tenantId, { estado: true }, actorUserId);

      expect(excelService.generateTurnosXlsx).toHaveBeenCalledWith([baseTurno]);
      expect(repository.logExportAudit).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
