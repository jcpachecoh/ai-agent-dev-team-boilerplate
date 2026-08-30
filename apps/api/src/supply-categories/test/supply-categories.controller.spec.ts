import { Test, TestingModule } from '@nestjs/testing';
import { SupplyCategoriesController } from '../controller/supply-categories.controller';
import { SupplyCategoriesService } from '../service/supply-categories.service';
import { SupplyItemsService } from '../../supplyitems/service/supplyitems.service';

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

const serviceMock = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const supplyItemsServiceMock = {
  getNextCodigoInterno: jest.fn(),
};

describe('SupplyCategoriesController', () => {
  let controller: SupplyCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplyCategoriesController],
      providers: [
        { provide: SupplyCategoriesService, useValue: serviceMock },
        { provide: SupplyItemsService, useValue: supplyItemsServiceMock },
      ],
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

    await expect(
      controller.create(tenantId, { nombre: 'Abarrotes', prefijo: 'ABR' }),
    ).resolves.toEqual(category);
  });

  it('getNextCodigo delegates to supply items service', async () => {
    supplyItemsServiceMock.getNextCodigoInterno.mockResolvedValue('ABR-000001');

    await expect(controller.getNextCodigo('cat-1', tenantId)).resolves.toEqual({
      codigoInterno: 'ABR-000001',
    });
  });

  it('update delegates to service', async () => {
    serviceMock.update.mockResolvedValue({ ...category, nombre: 'Nuevo' });

    await expect(controller.update('cat-1', tenantId, { nombre: 'Nuevo' })).resolves.toEqual({
      ...category,
      nombre: 'Nuevo',
    });
  });

  it('remove delegates to service', async () => {
    serviceMock.remove.mockResolvedValue(undefined);

    await expect(controller.remove('cat-1', tenantId)).resolves.toBeUndefined();
    expect(serviceMock.remove).toHaveBeenCalledWith(tenantId, 'cat-1');
  });
});
