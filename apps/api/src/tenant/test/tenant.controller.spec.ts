import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from '../controller/tenant.controller';
import { TenantService } from '../service/tenant.service';
import type { ValidatedFile } from '../../storage/pipes/file-validation.pipe';

const serviceMock = {
  uploadLogo: jest.fn(),
  findById: jest.fn(),
};

const user = {
  tenantId: 'palos-de-lena',
  sub: 'user-1',
  email: 'owner@test.com',
  roleCode: 'OWNER',
  roleId: 'role-owner',
};

const validFile: ValidatedFile = {
  buffer: Buffer.from('logo'),
  mimetype: 'image/png',
  originalname: 'logo.png',
  size: 4,
};

describe('TenantController', () => {
  let controller: TenantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [{ provide: TenantService, useValue: serviceMock }],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uploadLogo throws when file is missing', async () => {
    await expect(
      controller.uploadLogo(user, undefined as unknown as ValidatedFile),
    ).rejects.toThrow(BadRequestException);
  });

  it('uploadLogo delegates to service and returns logoUrl', async () => {
    const cdnUrl = 'https://cdn.opssynk.com/tenants/palos-de-lena/branding/uuid.webp';
    serviceMock.uploadLogo.mockResolvedValue({
      id: 'palos-de-lena',
      logoUrl: cdnUrl,
    });

    const result = await controller.uploadLogo(user, validFile);

    expect(result).toEqual({ logoUrl: cdnUrl });
    expect(serviceMock.uploadLogo).toHaveBeenCalledWith('palos-de-lena', 'user-1', validFile);
  });
});
