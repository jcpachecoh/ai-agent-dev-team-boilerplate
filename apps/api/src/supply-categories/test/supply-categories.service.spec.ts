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
  });

  it('findAll delegates to repository', async () => {
    repoMock.findAll.mockResolvedValue([category]);

    const result = await service.findAll(tenantId, true);

    expect(result).toEqual([category]);
    expect(repoMock.findAll).toHaveBeenCalledWith(tenantId, true);
  });

  it('create returns category from repository', async () => {
    repoMock.create.mockResolvedValue(category);

    const result = await service.create(tenantId, { nombre: 'Abarrotes' });

    expect(result).toEqual(category);
  });

  it('create throws ConflictException on unique violation', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });
    repoMock.create.mockRejectedValue(error);

    await expect(service.create(tenantId, { nombre: 'Abarrotes' })).rejects.toThrow(
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

    const result = await service.update(tenantId, 'cat-1', { nombre: 'Nuevo' });

    expect(result.nombre).toBe('Nuevo');
  });

  it('update throws ConflictException on unique violation', async () => {
    repoMock.findOne.mockResolvedValue(category);
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });
    repoMock.update.mockRejectedValue(error);

    await expect(service.update(tenantId, 'cat-1', { nombre: 'Dup' })).rejects.toThrow(
      ConflictException,
    );
  });
});
