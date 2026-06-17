import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { SupplyCategoriesRepository } from '../repository/supply-categories.repository';
import { SupplyCategoriesService } from '../service/supply-categories.service';

const tenantId = 'palos-de-lena';
const category = {
  id: 'cat-1',
  tenantId,
  nombre: 'Abarrotes',
  prefijo: 'ABR',
  descripcion: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findConflictingByNombre: jest.fn(),
  findConflictingByPrefijo: jest.fn(),
};

describe('SupplyCategoriesService', () => {
  let service: SupplyCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyCategoriesService,
        { provide: SupplyCategoriesRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get<SupplyCategoriesService>(SupplyCategoriesService);
    jest.clearAllMocks();
    repoMock.findConflictingByNombre.mockResolvedValue(null);
    repoMock.findConflictingByPrefijo.mockResolvedValue(null);
  });

  it('findAll delegates to repository', async () => {
    repoMock.findAll.mockResolvedValue([category]);

    const result = await service.findAll(tenantId, true);

    expect(result).toEqual([category]);
    expect(repoMock.findAll).toHaveBeenCalledWith(tenantId, true);
  });

  it('create returns category from repository', async () => {
    repoMock.create.mockResolvedValue(category);

    const result = await service.create(tenantId, { nombre: 'Abarrotes', prefijo: 'ABR' });

    expect(result).toEqual(category);
  });

  it('create throws ConflictException on unique violation', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['tenantId', 'prefijo'] },
    });
    repoMock.create.mockRejectedValue(error);

    await expect(service.create(tenantId, { nombre: 'Abarrotes', prefijo: 'ABR' })).rejects.toThrow(
      /prefijo ya está en uso/i,
    );
  });

  it('create throws when nombre is already used', async () => {
    repoMock.findConflictingByNombre.mockResolvedValue({
      ...category,
      id: 'cat-2',
      nombre: 'Abarrotes',
    });

    await expect(service.create(tenantId, { nombre: 'Abarrotes', prefijo: 'ABR' })).rejects.toThrow(
      /nombre "Abarrotes"/i,
    );
  });

  it('create throws when prefijo is already used', async () => {
    repoMock.findConflictingByPrefijo.mockResolvedValue({
      ...category,
      id: 'cat-2',
      nombre: 'Otra',
      prefijo: 'ABR',
    });

    await expect(service.create(tenantId, { nombre: 'Nueva', prefijo: 'ABR' })).rejects.toThrow(
      /prefijo "ABR" ya está en uso/i,
    );
  });

  it('create rethrows unknown errors', async () => {
    repoMock.create.mockRejectedValue(new Error('db down'));

    await expect(service.create(tenantId, { nombre: 'X', prefijo: 'XX' })).rejects.toThrow(
      'db down',
    );
  });

  it('update throws NotFoundException when category is missing', async () => {
    repoMock.findOne.mockResolvedValue(null);

    await expect(service.update(tenantId, 'missing', { nombre: 'Nuevo' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update returns updated category', async () => {
    repoMock.findOne.mockResolvedValue(category);
    repoMock.update.mockResolvedValue({ ...category, nombre: 'Nuevo' });

    const result = await service.update(tenantId, 'cat-1', { nombre: 'Nuevo' });

    expect(result.nombre).toBe('Nuevo');
    expect(repoMock.update).toHaveBeenCalledWith(tenantId, 'cat-1', { nombre: 'Nuevo' });
  });

  it('update skips write when values are unchanged', async () => {
    repoMock.findOne.mockResolvedValue(category);

    const result = await service.update(tenantId, 'cat-1', {
      nombre: 'Abarrotes',
      prefijo: 'ABR',
    });

    expect(result).toEqual(category);
    expect(repoMock.update).not.toHaveBeenCalled();
  });

  it('update throws when prefijo is already used by another category', async () => {
    repoMock.findOne.mockResolvedValue(category);
    repoMock.findConflictingByPrefijo.mockResolvedValue({
      ...category,
      id: 'cat-2',
      nombre: 'Activo fijo',
      prefijo: 'ACF',
    });

    await expect(service.update(tenantId, 'cat-1', { prefijo: 'ACF' })).rejects.toThrow(
      /prefijo "ACF" ya está en uso/i,
    );
  });

  it('update throws when nombre is already used by another category', async () => {
    repoMock.findOne.mockResolvedValue(category);
    repoMock.findConflictingByNombre.mockResolvedValue({
      ...category,
      id: 'cat-2',
      nombre: 'Cocina',
    });

    await expect(service.update(tenantId, 'cat-1', { nombre: 'Cocina' })).rejects.toThrow(
      /nombre "Cocina"/i,
    );
  });

  it('update patches descripcion and isActive without touching nombre or prefijo', async () => {
    repoMock.findOne.mockResolvedValue(category);
    repoMock.update.mockResolvedValue({ ...category, descripcion: 'Nueva', isActive: false });

    const result = await service.update(tenantId, 'cat-1', {
      descripcion: 'Nueva',
      isActive: false,
    });

    expect(result.descripcion).toBe('Nueva');
    expect(repoMock.update).toHaveBeenCalledWith(tenantId, 'cat-1', {
      descripcion: 'Nueva',
      isActive: false,
    });
  });

  it('update throws ConflictException on unique violation', async () => {
    repoMock.findOne.mockResolvedValue(category);
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['tenantId', 'nombre'] },
    });
    repoMock.update.mockRejectedValue(error);

    await expect(service.update(tenantId, 'cat-1', { nombre: 'Dup' })).rejects.toThrow(
      /nombre. Elija un nombre distinto/i,
    );
  });

  it('create maps generic unique violation to tenant conflict message', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['tenantId'] },
    });
    repoMock.create.mockRejectedValue(error);

    await expect(service.create(tenantId, { nombre: 'X', prefijo: 'XX' })).rejects.toThrow(
      /nombre o el prefijo ya existe/i,
    );
  });
});
