import { Test, TestingModule } from '@nestjs/testing';
import { RecipeCategoriesController } from '../controller/recipe-categories.controller';
import { RecipeCategoriesService } from '../service/recipe-categories.service';

const tenantId = 'palos-de-lena';
const category = {
  id: 'rcat-1',
  tenantId,
  nombre: 'Granos',
  descripcion: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const serviceMock = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('RecipeCategoriesController', () => {
  let controller: RecipeCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipeCategoriesController],
      providers: [{ provide: RecipeCategoriesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<RecipeCategoriesController>(RecipeCategoriesController);
    jest.clearAllMocks();
  });

  it('findAll delegates to service with tenant and filter', async () => {
    serviceMock.findAll.mockResolvedValue([category]);

    await expect(controller.findAll(tenantId, { isActive: true })).resolves.toEqual([category]);
    expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId, true);
  });

  it('create delegates to service', async () => {
    serviceMock.create.mockResolvedValue(category);

    await expect(controller.create(tenantId, { nombre: 'Granos' })).resolves.toEqual(category);
  });

  it('update delegates to service', async () => {
    serviceMock.update.mockResolvedValue({ ...category, nombre: 'Nuevo' });

    await expect(controller.update('rcat-1', tenantId, { nombre: 'Nuevo' })).resolves.toEqual({
      ...category,
      nombre: 'Nuevo',
    });
  });

  it('remove delegates to service', async () => {
    serviceMock.remove.mockResolvedValue(undefined);

    await expect(controller.remove('rcat-1', tenantId)).resolves.toBeUndefined();
    expect(serviceMock.remove).toHaveBeenCalledWith(tenantId, 'rcat-1');
  });
});
