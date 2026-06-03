import { Test, TestingModule } from '@nestjs/testing';
import { SupplyCategoriesController } from '../controller/supply-categories.controller';
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

const serviceMock = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

describe('SupplyCategoriesController', () => {
  let controller: SupplyCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplyCategoriesController],
      providers: [{ provide: SupplyCategoriesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SupplyCategoriesController>(SupplyCategoriesController);
    jest.clearAllMocks();
  });

  it('findAll delegates to service with tenant and filter', async () => {
    serviceMock.findAll.mockResolvedValue([category]);

    await expect(controller.findAll(tenantId, { isActive: true })).resolves.toEqual([category]);
    expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId, true);
  });

  it('create delegates to service', async () => {
    serviceMock.create.mockResolvedValue(category);

    await expect(controller.create(tenantId, { nombre: 'Abarrotes' })).resolves.toEqual(category);
  });

  it('update delegates to service', async () => {
    serviceMock.update.mockResolvedValue({ ...category, nombre: 'Nuevo' });

    await expect(controller.update('cat-1', tenantId, { nombre: 'Nuevo' })).resolves.toEqual({
      ...category,
      nombre: 'Nuevo',
    });
  });
});
