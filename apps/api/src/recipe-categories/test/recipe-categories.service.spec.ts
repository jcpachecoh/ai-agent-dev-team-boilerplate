import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { RecipeCategoriesRepository } from '../repository/recipe-categories.repository';
import { RecipeCategoriesService } from '../service/recipe-categories.service';

const tenantId = 'palos-de-lena';
const category = {
  id: 'rcat-1',
  tenantId,
  nombre: 'Platos principales',
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
  remove: jest.fn(),
};

describe('RecipeCategoriesService', () => {
  let service: RecipeCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeCategoriesService,
        { provide: RecipeCategoriesRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get<RecipeCategoriesService>(RecipeCategoriesService);
    jest.clearAllMocks();
  });

  it('findAll delegates to repository', async () => {
    repoMock.findAll.mockResolvedValue([category]);

    const result = await service.findAll(tenantId, true);

    expect(result).toEqual([category]);
    expect(repoMock.findAll).toHaveBeenCalledWith(tenantId, true);
  });

  it('findOne throws NotFoundException when category is missing', async () => {
    repoMock.findOne.mockResolvedValue(null);

    await expect(service.findOne(tenantId, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('findOne returns category from repository', async () => {
    repoMock.findOne.mockResolvedValue(category);

    await expect(service.findOne(tenantId, 'rcat-1')).resolves.toEqual(category);
  });

  it('create returns category from repository', async () => {
    repoMock.create.mockResolvedValue(category);

    const result = await service.create(tenantId, { nombre: 'Platos principales' });

    expect(result).toEqual(category);
  });

  it('create throws ConflictException on unique violation', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });
    repoMock.create.mockRejectedValue(error);

    await expect(service.create(tenantId, { nombre: 'Platos principales' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('create rethrows unknown errors', async () => {
    repoMock.create.mockRejectedValue(new Error('db down'));

    await expect(service.create(tenantId, { nombre: 'X' })).rejects.toThrow('db down');
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

    const result = await service.update(tenantId, 'rcat-1', { nombre: 'Nuevo' });

    expect(result.nombre).toBe('Nuevo');
  });

  it('update throws ConflictException on unique violation', async () => {
    repoMock.findOne.mockResolvedValue(category);
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });
    repoMock.update.mockRejectedValue(error);

    await expect(service.update(tenantId, 'rcat-1', { nombre: 'Dup' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('update rethrows unknown errors', async () => {
    repoMock.findOne.mockResolvedValue(category);
    repoMock.update.mockRejectedValue(new Error('db down'));

    await expect(service.update(tenantId, 'rcat-1', { nombre: 'X' })).rejects.toThrow('db down');
  });

  it('remove throws NotFoundException when category is missing', async () => {
    repoMock.findOne.mockResolvedValue(null);

    await expect(service.remove(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    expect(repoMock.remove).not.toHaveBeenCalled();
  });

  it('remove deletes category after findOne succeeds', async () => {
    repoMock.findOne.mockResolvedValue(category);
    repoMock.remove.mockResolvedValue(undefined);

    await expect(service.remove(tenantId, 'rcat-1')).resolves.toBeUndefined();
    expect(repoMock.remove).toHaveBeenCalledWith(tenantId, 'rcat-1');
  });
});
