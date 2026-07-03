import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EmployeeCatalogType } from '@prisma/client';
import { EmployeeCatalogController } from '../controller/employee-catalog.controller';
import { EmployeeCatalogService } from '../service/employee-catalog.service';

describe('EmployeeCatalogController', () => {
  let controller: EmployeeCatalogController;
  let service: EmployeeCatalogService;

  const mockTenantId = 'tenant-1';
  const mockUser = { tenantId: mockTenantId };
  const mockOptions = [
    {
      id: 'opt-1',
      tenantId: mockTenantId,
      type: EmployeeCatalogType.EPS,
      name: 'Sura',
      isActive: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeCatalogController],
      providers: [
        {
          provide: EmployeeCatalogService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmployeeCatalogController>(EmployeeCatalogController);
    service = module.get<EmployeeCatalogService>(EmployeeCatalogService);
  });

  it('should delegate to service.findAll', async () => {
    (service.findAll as jest.Mock).mockResolvedValue(mockOptions);

    const result = await controller.findAll(mockUser, mockTenantId, {
      type: EmployeeCatalogType.EPS,
    });

    expect(service.findAll).toHaveBeenCalledWith(mockTenantId, EmployeeCatalogType.EPS);
    expect(result).toEqual([{ id: 'opt-1', type: EmployeeCatalogType.EPS, name: 'Sura' }]);
  });

  it('should throw BadRequestException when no tenant id', async () => {
    await expect(controller.findAll({}, '', {})).rejects.toThrow(BadRequestException);
  });
});
