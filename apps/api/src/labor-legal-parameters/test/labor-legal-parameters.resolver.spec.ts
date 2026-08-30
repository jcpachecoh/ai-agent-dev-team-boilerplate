import { ForbiddenException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { LaborLegalParameter } from '@prisma/client';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import type { GqlRequestContext } from '../../common/graphql/tenant-from-context';
import { PermissionsService } from '../../permissions/service/permissions.service';
import {
  CreateLaborLegalParameterInput,
  LaborLegalParametersResolver,
  UpdateLaborLegalParameterInput,
} from '../resolver/labor-legal-parameters.resolver';
import { LaborLegalParametersService } from '../service/labor-legal-parameters.service';

const TENANT_ID = 'tenant-001';
const OTHER_TENANT_ID = 'tenant-002';
const ACTOR_ID = 'user-admin-001';

function makeRow(overrides: Partial<LaborLegalParameter> = {}): LaborLegalParameter {
  return {
    id: 'row-1',
    tenantId: null,
    tenantScope: 'GLOBAL',
    key: 'SMLV',
    value: 1750905 as unknown as LaborLegalParameter['value'],
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validTo: null,
    source: 'Decreto 1469 de 2025',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeUser(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    sub: ACTOR_ID,
    email: 'superadmin@opssynk.dev',
    tenantId: TENANT_ID,
    roleId: 'role-super-admin',
    roleCode: 'SUPER_ADMIN',
    ...overrides,
  };
}

const emptyContext: GqlRequestContext = { req: { headers: {} } };

describe('LaborLegalParametersResolver', () => {
  let resolver: LaborLegalParametersResolver;
  let service: jest.Mocked<LaborLegalParametersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LaborLegalParametersResolver,
        {
          provide: LaborLegalParametersService,
          useValue: {
            getValueAt: jest.fn(),
            preload: jest.fn(),
            listCurrent: jest.fn(),
            listHistory: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: { hasPermission: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    resolver = module.get(LaborLegalParametersResolver);
    service = module.get(LaborLegalParametersService);
  });

  describe('laborLegalParameters', () => {
    it('delega en service.listCurrent con el tenant del actor y mapea las filas', async () => {
      // Arrange
      const row = makeRow();
      service.listCurrent.mockResolvedValue([row]);

      // Act
      const result = await resolver.laborLegalParameters(makeUser(), emptyContext);

      // Assert
      expect(service.listCurrent).toHaveBeenCalledWith(TENANT_ID);
      expect(result).toEqual([
        expect.objectContaining({ id: row.id, key: 'SMLV', value: 1750905, isGlobal: true }),
      ]);
    });

    it('lanza ForbiddenException si se pide un tenantId distinto al del actor', async () => {
      await expect(
        resolver.laborLegalParameters(makeUser(), emptyContext, OTHER_TENANT_ID),
      ).rejects.toThrow(ForbiddenException);
      expect(service.listCurrent).not.toHaveBeenCalled();
    });
  });

  describe('laborLegalParameterHistory', () => {
    it('delega en service.listHistory con la key y el tenant del actor', async () => {
      const row = makeRow();
      service.listHistory.mockResolvedValue([row]);

      const result = await resolver.laborLegalParameterHistory(makeUser(), emptyContext, 'SMLV');

      expect(service.listHistory).toHaveBeenCalledWith('SMLV', TENANT_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('laborLegalParameterValueAt', () => {
    it('delega en service.getValueAt con key, fecha y tenant del actor', async () => {
      service.getValueAt.mockResolvedValue(1750905);
      const date = new Date('2026-07-09T00:00:00.000Z');

      const result = await resolver.laborLegalParameterValueAt(
        makeUser(),
        emptyContext,
        'SMLV',
        date,
      );

      expect(service.getValueAt).toHaveBeenCalledWith('SMLV', date, TENANT_ID);
      expect(result).toBe(1750905);
    });
  });

  describe('createLaborLegalParameter', () => {
    it('delega en service.create con el input y el actor resuelto', async () => {
      const created = makeRow({ id: 'new-row' });
      service.create.mockResolvedValue(created);
      const input: CreateLaborLegalParameterInput = {
        key: 'SMLV',
        value: 1750905,
        validFrom: new Date('2026-01-01'),
      };

      const result = await resolver.createLaborLegalParameter(makeUser(), emptyContext, input);

      expect(service.create).toHaveBeenCalledWith(
        {
          key: 'SMLV',
          value: 1750905,
          validFrom: input.validFrom,
          validTo: null,
          source: null,
          tenantId: null,
        },
        { userId: ACTOR_ID, tenantId: TENANT_ID, roleCode: 'SUPER_ADMIN' },
      );
      expect(result.id).toBe('new-row');
    });
  });

  describe('updateLaborLegalParameter', () => {
    it('delega en service.update con el id, el input y el actor resuelto', async () => {
      const updated = makeRow({ id: 'row-1', value: 5 as unknown as LaborLegalParameter['value'] });
      service.update.mockResolvedValue(updated);
      const input: UpdateLaborLegalParameterInput = { value: 5 };

      const result = await resolver.updateLaborLegalParameter(
        makeUser(),
        emptyContext,
        'row-1',
        input,
      );

      expect(service.update).toHaveBeenCalledWith(
        'row-1',
        { value: 5, validFrom: undefined, validTo: undefined, source: undefined },
        { userId: ACTOR_ID, tenantId: TENANT_ID, roleCode: 'SUPER_ADMIN' },
      );
      expect(result.value).toBe(5);
    });
  });

  describe('deleteLaborLegalParameter', () => {
    it('delega en service.softDelete con el id y el actor resuelto, devuelve true', async () => {
      service.softDelete.mockResolvedValue(undefined);

      const result = await resolver.deleteLaborLegalParameter(makeUser(), emptyContext, 'row-1');

      expect(service.softDelete).toHaveBeenCalledWith('row-1', {
        userId: ACTOR_ID,
        tenantId: TENANT_ID,
        roleCode: 'SUPER_ADMIN',
      });
      expect(result).toBe(true);
    });
  });

  describe('resolución de tenant desde el contexto', () => {
    it('usa x-tenant-id del contexto cuando el JWT no trae tenantId', async () => {
      service.listCurrent.mockResolvedValue([]);
      const userWithoutTenant = makeUser({ tenantId: undefined as unknown as string });
      const context: GqlRequestContext = { req: { headers: { 'x-tenant-id': OTHER_TENANT_ID } } };

      await resolver.laborLegalParameters(userWithoutTenant, context);

      expect(service.listCurrent).toHaveBeenCalledWith(OTHER_TENANT_ID);
    });
  });
});
