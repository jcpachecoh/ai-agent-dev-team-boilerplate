import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import {
  CreateSupplyCategoryInputDto,
  SupplyCategoriesResolver,
} from '../resolver/supply-categories.resolver';
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

const serviceMock = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

function contextWithTenant(tenant?: string) {
  return {
    req: {
      headers: tenant ? { 'x-tenant-id': tenant } : {},
    } as Request,
  };
}

describe('SupplyCategoriesResolver', () => {
  let resolver: SupplyCategoriesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyCategoriesResolver,
        { provide: SupplyCategoriesService, useValue: serviceMock },
      ],
    }).compile();

    resolver = module.get<SupplyCategoriesResolver>(SupplyCategoriesResolver);
    jest.clearAllMocks();
  });

  it('supplyCategories returns categories for tenant', async () => {
    serviceMock.findAll.mockResolvedValue([category]);

    await expect(resolver.supplyCategories(contextWithTenant(tenantId), true)).resolves.toEqual([
      category,
    ]);
    expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId, true);
  });

  it('createSupplyCategory delegates to service', async () => {
    serviceMock.create.mockResolvedValue(category);
    const input = { nombre: 'Abarrotes', prefijo: 'ABR' } as CreateSupplyCategoryInputDto;

    await expect(
      resolver.createSupplyCategory(contextWithTenant(tenantId), input),
    ).resolves.toEqual(category);
  });

  it('throws when x-tenant-id header is missing', () => {
    expect(() => resolver.supplyCategories(contextWithTenant(), true)).toThrow(BadRequestException);
  });
});
