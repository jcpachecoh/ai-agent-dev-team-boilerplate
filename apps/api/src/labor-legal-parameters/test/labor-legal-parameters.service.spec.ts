import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import type { LaborLegalParameter } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import { GLOBAL_TENANT_SCOPE } from '../labor-legal-parameters.constants';
import { LaborLegalParametersRepository } from '../repository/labor-legal-parameters.repository';
import { LaborLegalParametersService } from '../service/labor-legal-parameters.service';

const TENANT_ID = 'tenant-001';
const OTHER_TENANT_ID = 'tenant-002';
const ACTOR_ID = 'user-admin-001';

function makeRow(overrides: Partial<LaborLegalParameter> = {}): LaborLegalParameter {
  return {
    id: 'row-id',
    tenantId: null,
    tenantScope: GLOBAL_TENANT_SCOPE,
    key: 'RECARGO_DOMINICAL_FESTIVO',
    // service does Number(row.value) — a plain number satisfies that at runtime
    value: 0.75 as unknown as Prisma.Decimal,
    validFrom: new Date('2020-01-01T00:00:00.000Z'),
    validTo: null,
    source: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Seed data mirroring prisma/seeds/labor-legal-parameters.seed.ts (global scope). */
const RECARGO_ROWS: LaborLegalParameter[] = [
  makeRow({
    id: 'recargo-1',
    value: 0.75 as unknown as Prisma.Decimal,
    validFrom: new Date('2020-01-01T00:00:00.000Z'),
    validTo: new Date('2025-06-30T23:59:59.999Z'),
  }),
  makeRow({
    id: 'recargo-2',
    value: 0.8 as unknown as Prisma.Decimal,
    validFrom: new Date('2025-07-01T00:00:00.000Z'),
    validTo: new Date('2026-06-30T23:59:59.999Z'),
  }),
  makeRow({
    id: 'recargo-3',
    value: 0.9 as unknown as Prisma.Decimal,
    validFrom: new Date('2026-07-01T00:00:00.000Z'),
    validTo: new Date('2027-06-30T23:59:59.999Z'),
  }),
  makeRow({
    id: 'recargo-4',
    value: 1.0 as unknown as Prisma.Decimal,
    validFrom: new Date('2027-07-01T00:00:00.000Z'),
    validTo: null,
  }),
];

const HORARIO_ROWS: LaborLegalParameter[] = [
  makeRow({
    id: 'horario-1',
    key: 'HORARIO_NOCTURNO_INICIO',
    value: 21 as unknown as Prisma.Decimal,
    validFrom: new Date('2020-01-01T00:00:00.000Z'),
    validTo: new Date('2025-12-24T23:59:59.999Z'),
  }),
  makeRow({
    id: 'horario-2',
    key: 'HORARIO_NOCTURNO_INICIO',
    value: 19 as unknown as Prisma.Decimal,
    validFrom: new Date('2025-12-25T00:00:00.000Z'),
    validTo: null,
  }),
];

/** Mirrors JORNADA_MAX_SEMANAL vigencias in prisma/seeds/labor-legal-parameters.seed.ts (Ley 2101/2021). */
const JORNADA_ROWS: LaborLegalParameter[] = [
  makeRow({
    id: 'jornada-1',
    key: 'JORNADA_MAX_SEMANAL',
    value: 46 as unknown as Prisma.Decimal,
    validFrom: new Date('2024-07-15T00:00:00.000Z'),
    validTo: new Date('2025-07-14T23:59:59.999Z'),
  }),
  makeRow({
    id: 'jornada-2',
    key: 'JORNADA_MAX_SEMANAL',
    value: 44 as unknown as Prisma.Decimal,
    validFrom: new Date('2025-07-15T00:00:00.000Z'),
    validTo: new Date('2026-07-14T23:59:59.999Z'),
  }),
  makeRow({
    id: 'jornada-3',
    key: 'JORNADA_MAX_SEMANAL',
    value: 42 as unknown as Prisma.Decimal,
    validFrom: new Date('2026-07-15T00:00:00.000Z'),
    validTo: null,
  }),
];

/** Mirrors SMLV vigencias in prisma/seeds/labor-legal-parameters.seed.ts. */
const SMLV_ROWS: LaborLegalParameter[] = [
  makeRow({
    id: 'smlv-2025',
    key: 'SMLV',
    value: 1423500 as unknown as Prisma.Decimal,
    validFrom: new Date('2025-01-01T00:00:00.000Z'),
    validTo: new Date('2025-12-31T23:59:59.999Z'),
  }),
  makeRow({
    id: 'smlv-2026',
    key: 'SMLV',
    value: 1750905 as unknown as Prisma.Decimal,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validTo: null,
  }),
];

/** Mirrors AUXILIO_TRANSPORTE vigencias in prisma/seeds/labor-legal-parameters.seed.ts. */
const AUXILIO_ROWS: LaborLegalParameter[] = [
  makeRow({
    id: 'auxilio-2025',
    key: 'AUXILIO_TRANSPORTE',
    value: 200000 as unknown as Prisma.Decimal,
    validFrom: new Date('2025-01-01T00:00:00.000Z'),
    validTo: new Date('2025-12-31T23:59:59.999Z'),
  }),
  makeRow({
    id: 'auxilio-2026',
    key: 'AUXILIO_TRANSPORTE',
    value: 249095 as unknown as Prisma.Decimal,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validTo: null,
  }),
];

/** Fake repository — filters an in-memory dataset the same way the real Prisma query does. */
function findActiveAtFake(
  dataset: LaborLegalParameter[],
  tenantScope: string,
  key: string,
  date: Date,
): LaborLegalParameter | null {
  const matches = dataset
    .filter(
      (r) =>
        r.tenantScope === tenantScope &&
        r.key === key &&
        r.deletedAt === null &&
        r.validFrom <= date &&
        (r.validTo === null || r.validTo >= date),
    )
    .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime());
  return matches[0] ?? null;
}

describe('LaborLegalParametersService', () => {
  let service: LaborLegalParametersService;
  let repository: jest.Mocked<LaborLegalParametersRepository>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LaborLegalParametersService,
        {
          provide: LaborLegalParametersRepository,
          useValue: {
            findActiveAt: jest.fn(),
            findOverlapping: jest.fn(),
            findRowsForRange: jest.fn(),
            findCurrentByScopes: jest.fn(),
            findHistory: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(LaborLegalParametersService);
    repository = module.get(LaborLegalParametersRepository);
    auditService = module.get(AuditService);
  });

  describe('getValueAt', () => {
    beforeEach(() => {
      repository.findActiveAt.mockImplementation((tenantScope, key, date) => {
        const dataset =
          key === 'HORARIO_NOCTURNO_INICIO'
            ? HORARIO_ROWS
            : key === 'JORNADA_MAX_SEMANAL'
              ? JORNADA_ROWS
              : key === 'SMLV'
                ? SMLV_ROWS
                : key === 'AUXILIO_TRANSPORTE'
                  ? AUXILIO_ROWS
                  : RECARGO_ROWS;
        return Promise.resolve(findActiveAtFake(dataset, tenantScope, key, date));
      });
    });

    it('RECARGO_DOMINICAL_FESTIVO en 2026-06-15 resuelve a 0.80', async () => {
      // Act
      const value = await service.getValueAt(
        'RECARGO_DOMINICAL_FESTIVO',
        new Date('2026-06-15T00:00:00.000Z'),
      );

      // Assert
      expect(value).toBe(0.8);
    });

    it('RECARGO_DOMINICAL_FESTIVO en 2026-07-01 resuelve a 0.90', async () => {
      const value = await service.getValueAt(
        'RECARGO_DOMINICAL_FESTIVO',
        new Date('2026-07-01T00:00:00.000Z'),
      );
      expect(value).toBe(0.9);
    });

    it('RECARGO_DOMINICAL_FESTIVO en 2026-07-15 sigue en 0.90 (misma vigencia)', async () => {
      const value = await service.getValueAt(
        'RECARGO_DOMINICAL_FESTIVO',
        new Date('2026-07-15T00:00:00.000Z'),
      );
      expect(value).toBe(0.9);
    });

    it('límite exacto: 2026-06-30 = 0.80 y 2026-07-01 = 0.90', async () => {
      const before = await service.getValueAt(
        'RECARGO_DOMINICAL_FESTIVO',
        new Date('2026-06-30T23:59:59.999Z'),
      );
      const after = await service.getValueAt(
        'RECARGO_DOMINICAL_FESTIVO',
        new Date('2026-07-01T00:00:00.000Z'),
      );
      expect(before).toBe(0.8);
      expect(after).toBe(0.9);
    });

    it('HORARIO_NOCTURNO_INICIO en 2025-12-24 resuelve a 21', async () => {
      const value = await service.getValueAt(
        'HORARIO_NOCTURNO_INICIO',
        new Date('2025-12-24T12:00:00.000Z'),
      );
      expect(value).toBe(21);
    });

    it('HORARIO_NOCTURNO_INICIO en 2025-12-25 resuelve a 19 (Ley 2466 de 2025)', async () => {
      const value = await service.getValueAt(
        'HORARIO_NOCTURNO_INICIO',
        new Date('2025-12-25T00:00:00.000Z'),
      );
      expect(value).toBe(19);
    });

    it('JORNADA_MAX_SEMANAL en 2026-07-14 resuelve a 44 (último día de la vigencia anterior)', async () => {
      const value = await service.getValueAt(
        'JORNADA_MAX_SEMANAL',
        new Date('2026-07-14T23:59:59.999Z'),
      );
      expect(value).toBe(44);
    });

    it('JORNADA_MAX_SEMANAL en 2026-07-15 resuelve a 42 (Ley 2101 de 2021 — corte final)', async () => {
      const value = await service.getValueAt(
        'JORNADA_MAX_SEMANAL',
        new Date('2026-07-15T00:00:00.000Z'),
      );
      expect(value).toBe(42);
    });

    it('SMLV en 2026-07-09 resuelve a 1750905 (Decreto 1469 de 2025)', async () => {
      const value = await service.getValueAt('SMLV', new Date('2026-07-09T00:00:00.000Z'));
      expect(value).toBe(1750905);
    });

    it('AUXILIO_TRANSPORTE en 2026-07-09 resuelve a 249095 (Decreto 1470 de 2025)', async () => {
      const value = await service.getValueAt(
        'AUXILIO_TRANSPORTE',
        new Date('2026-07-09T00:00:00.000Z'),
      );
      expect(value).toBe(249095);
    });

    it('override de tenant gana sobre el valor global para la misma fecha', async () => {
      // Arrange — el tenant tiene un override propio de RECARGO_DOMINICAL_FESTIVO
      const tenantOverride = makeRow({
        id: 'tenant-override',
        tenantId: TENANT_ID,
        tenantScope: TENANT_ID,
        value: 0.99 as unknown as Prisma.Decimal,
        validFrom: new Date('2025-07-01T00:00:00.000Z'),
        validTo: null,
      });
      repository.findActiveAt.mockImplementation((tenantScope, key, date) => {
        if (tenantScope === TENANT_ID) {
          return Promise.resolve(findActiveAtFake([tenantOverride], tenantScope, key, date));
        }
        return Promise.resolve(findActiveAtFake(RECARGO_ROWS, tenantScope, key, date));
      });

      // Act
      const value = await service.getValueAt(
        'RECARGO_DOMINICAL_FESTIVO',
        new Date('2026-06-15T00:00:00.000Z'),
        TENANT_ID,
      );

      // Assert — el override (0.99) gana sobre el global (0.80)
      expect(value).toBe(0.99);
    });

    it('sin override de tenant, cae al valor global', async () => {
      // Act — TENANT_ID no tiene filas propias en el dataset mockeado
      const value = await service.getValueAt(
        'RECARGO_DOMINICAL_FESTIVO',
        new Date('2026-06-15T00:00:00.000Z'),
        OTHER_TENANT_ID,
      );

      // Assert
      expect(value).toBe(0.8);
    });

    it('lanza NotFoundException si no hay valor vigente para esa fecha', async () => {
      // Act & Assert — antes de 2020-01-01 no hay ninguna vigencia seedeada
      await expect(
        service.getValueAt('RECARGO_DOMINICAL_FESTIVO', new Date('2010-01-01T00:00:00.000Z')),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('preload', () => {
    it('consulta el repositorio con scopes [tenantId, GLOBAL] y devuelve un snapshot resoluble', async () => {
      // Arrange
      repository.findRowsForRange.mockResolvedValue(RECARGO_ROWS);
      const from = new Date('2026-01-01T00:00:00.000Z');
      const to = new Date('2026-12-31T00:00:00.000Z');

      // Act
      const snapshot = await service.preload(['RECARGO_DOMINICAL_FESTIVO'], from, to, TENANT_ID);

      // Assert
      expect(repository.findRowsForRange).toHaveBeenCalledWith(
        [TENANT_ID, GLOBAL_TENANT_SCOPE],
        ['RECARGO_DOMINICAL_FESTIVO'],
        from,
        to,
      );
      expect(
        snapshot.numberAt('RECARGO_DOMINICAL_FESTIVO', new Date('2026-06-15T00:00:00.000Z')),
      ).toBe(0.8);
    });

    it('consulta solo el scope GLOBAL cuando no se pasa tenantId', async () => {
      repository.findRowsForRange.mockResolvedValue([]);

      await service.preload(['SMLV'], new Date('2026-01-01'), null);

      expect(repository.findRowsForRange).toHaveBeenCalledWith(
        [GLOBAL_TENANT_SCOPE],
        ['SMLV'],
        new Date('2026-01-01'),
        null,
      );
    });
  });

  describe('listCurrent', () => {
    it('devuelve todas las filas activas/próximas sin colapsar por key', async () => {
      // Arrange — dos filas de la misma key, una global y una del tenant
      const globalRow = makeRow({ id: 'g1', key: 'SMLV' });
      const tenantRow = makeRow({
        id: 't1',
        key: 'SMLV',
        tenantId: TENANT_ID,
        tenantScope: TENANT_ID,
      });
      repository.findCurrentByScopes.mockResolvedValue([tenantRow, globalRow]);

      // Act
      const rows = await service.listCurrent(TENANT_ID);

      // Assert
      expect(repository.findCurrentByScopes).toHaveBeenCalledWith(
        [TENANT_ID, GLOBAL_TENANT_SCOPE],
        expect.any(Date),
      );
      expect(rows).toEqual([tenantRow, globalRow]);
    });

    it('mantiene el valor global si no hay override de tenant para esa key', async () => {
      const globalRow = makeRow({ id: 'g1', key: 'SMLV' });
      repository.findCurrentByScopes.mockResolvedValue([globalRow]);

      const rows = await service.listCurrent(null);

      expect(rows).toEqual([globalRow]);
    });
  });

  describe('listHistory', () => {
    it('lanza BadRequestException si la key no es válida', async () => {
      await expect(service.listHistory('NOT_A_REAL_KEY' as never, null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('delega en el repositorio con el tenantScope resuelto', async () => {
      repository.findHistory.mockResolvedValue(RECARGO_ROWS);

      const rows = await service.listHistory('RECARGO_DOMINICAL_FESTIVO', TENANT_ID);

      expect(repository.findHistory).toHaveBeenCalledWith(TENANT_ID, 'RECARGO_DOMINICAL_FESTIVO');
      expect(rows).toBe(RECARGO_ROWS);
    });
  });

  describe('create — validaciones', () => {
    const actor = { userId: ACTOR_ID, tenantId: TENANT_ID, roleCode: 'SUPER_ADMIN' };

    it('lanza BadRequestException si la key no es válida', async () => {
      await expect(
        service.create(
          { key: 'NOT_A_REAL_KEY', value: 1, validFrom: new Date('2026-01-01') },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si validTo es anterior a validFrom', async () => {
      await expect(
        service.create(
          {
            key: 'SMLV',
            value: 1,
            validFrom: new Date('2026-06-01'),
            validTo: new Date('2026-01-01'),
          },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza ConflictException si la nueva vigencia se traslapa con una existente', async () => {
      // Arrange
      repository.findOverlapping.mockResolvedValue([makeRow()]);

      // Act & Assert
      await expect(
        service.create({ key: 'SMLV', value: 1500000, validFrom: new Date('2026-01-01') }, actor),
      ).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rechaza con ForbiddenException si un OWNER intenta crear un parámetro global', async () => {
      const ownerActor = { userId: ACTOR_ID, tenantId: TENANT_ID, roleCode: 'OWNER' };
      await expect(
        service.create(
          { key: 'SMLV', value: 1500000, validFrom: new Date('2026-01-01'), tenantId: null },
          ownerActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza con ForbiddenException si el tenantId objetivo no es el propio del actor', async () => {
      await expect(
        service.create(
          {
            key: 'SMLV',
            value: 1500000,
            validFrom: new Date('2026-01-01'),
            tenantId: OTHER_TENANT_ID,
          },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('registra AuditLog CREATE al crear una vigencia válida', async () => {
      // Arrange
      repository.findOverlapping.mockResolvedValue([]);
      const created = makeRow({
        id: 'new-row',
        key: 'SMLV',
        value: 1500000 as unknown as Prisma.Decimal,
      });
      repository.create.mockResolvedValue(created);

      // Act
      const result = await service.create(
        { key: 'SMLV', value: 1500000, validFrom: new Date('2026-01-01') },
        actor,
      );

      // Assert
      expect(result).toBe(created);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          action: 'CREATE',
          entityType: 'LaborLegalParameter',
          entityId: 'new-row',
          actorUserId: ACTOR_ID,
        }),
      );
    });

    it('convierte una colisión P2002 de la BD (race condition) en ConflictException', async () => {
      // Arrange
      repository.findOverlapping.mockResolvedValue([]);
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      repository.create.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(
        service.create({ key: 'SMLV', value: 1500000, validFrom: new Date('2026-01-01') }, actor),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update — validaciones', () => {
    const actor = { userId: ACTOR_ID, tenantId: TENANT_ID, roleCode: 'SUPER_ADMIN' };

    it('lanza NotFoundException si el parámetro no existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('missing-id', { value: 1 }, actor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException si el registro ya está soft-deleted', async () => {
      repository.findById.mockResolvedValue(makeRow({ deletedAt: new Date() }));
      await expect(service.update('deleted-id', { value: 1 }, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('registra AuditLog UPDATE con oldValue/newValue', async () => {
      // Arrange
      const existing = makeRow({ id: 'row-1', value: 0.8 as unknown as Prisma.Decimal });
      const updated = makeRow({ id: 'row-1', value: 0.9 as unknown as Prisma.Decimal });
      repository.findById.mockResolvedValue(existing);
      repository.update.mockResolvedValue(updated);

      // Act
      await service.update('row-1', { value: 0.9 }, actor);

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entityType: 'LaborLegalParameter',
          entityId: 'row-1',
          oldValue: expect.objectContaining({ value: '0.8' }),
          newValue: expect.objectContaining({ value: '0.9' }),
        }),
      );
    });

    it('rechaza con ForbiddenException si el actor no administra el scope del registro existente', async () => {
      const otherTenantActor = { userId: ACTOR_ID, tenantId: OTHER_TENANT_ID, roleCode: 'OWNER' };
      repository.findById.mockResolvedValue(makeRow({ tenantId: TENANT_ID }));

      await expect(service.update('row-1', { value: 1 }, otherTenantActor)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lanza ConflictException si el nuevo rango de validFrom/validTo se traslapa con otra vigencia', async () => {
      // Arrange — cambiar validFrom dispara la revalidación de traslapes
      repository.findById.mockResolvedValue(makeRow({ id: 'row-1' }));
      repository.findOverlapping.mockResolvedValue([makeRow({ id: 'other-row' })]);

      // Act & Assert
      await expect(
        service.update('row-1', { validFrom: new Date('2026-01-01') }, actor),
      ).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('no revalida traslapes si solo cambia el value (validFrom/validTo intactos)', async () => {
      repository.findById.mockResolvedValue(makeRow({ id: 'row-1' }));
      repository.update.mockResolvedValue(
        makeRow({ id: 'row-1', value: 5 as unknown as Prisma.Decimal }),
      );

      await service.update('row-1', { value: 5 }, actor);

      expect(repository.findOverlapping).not.toHaveBeenCalled();
    });

    it('convierte una colisión P2002 de la BD (race condition) en ConflictException', async () => {
      repository.findById.mockResolvedValue(makeRow({ id: 'row-1' }));
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      repository.update.mockRejectedValue(prismaError);

      await expect(service.update('row-1', { value: 1 }, actor)).rejects.toThrow(ConflictException);
    });
  });

  describe('softDelete', () => {
    const actor = { userId: ACTOR_ID, tenantId: TENANT_ID, roleCode: 'SUPER_ADMIN' };

    it('lanza BadRequestException si ya está eliminado', async () => {
      repository.findById.mockResolvedValue(makeRow({ deletedAt: new Date() }));
      await expect(service.softDelete('row-1', actor)).rejects.toThrow(BadRequestException);
    });

    it('registra AuditLog DELETE', async () => {
      // Arrange
      repository.findById.mockResolvedValue(makeRow({ id: 'row-1' }));

      // Act
      await service.softDelete('row-1', actor);

      // Assert
      expect(repository.softDelete).toHaveBeenCalledWith('row-1');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          entityType: 'LaborLegalParameter',
          entityId: 'row-1',
          actorUserId: ACTOR_ID,
        }),
      );
    });
  });
});
