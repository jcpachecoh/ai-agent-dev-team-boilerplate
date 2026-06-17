import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from '../controller/tenant.controller';
import { TenantService } from '../service/tenant.service';

const serviceMock = {
  uploadLogo: jest.fn(),
  resolveLogoFilePath: jest.fn(),
};

const user = {
  tenantId: 'palos-de-lena',
  sub: 'user-1',
  email: 'owner@test.com',
  roleCode: 'OWNER',
  roleId: 'role-owner',
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
    await expect(controller.uploadLogo(user, undefined)).rejects.toThrow(BadRequestException);
  });

  it('uploadLogo delegates to service', async () => {
    serviceMock.uploadLogo.mockResolvedValue({
      id: 'palos-de-lena',
      logoUrl: '/api/tenant/logo/palos-de-lena',
    });

    const result = await controller.uploadLogo(user, {
      mimetype: 'image/png',
      buffer: Buffer.from('logo'),
    });

    expect(result).toEqual({ logoUrl: '/api/tenant/logo/palos-de-lena' });
    expect(serviceMock.uploadLogo).toHaveBeenCalledWith('palos-de-lena', {
      mimetype: 'image/png',
      buffer: expect.any(Buffer),
    });
  });

  it('serveLogo throws when logo file is missing', async () => {
    serviceMock.resolveLogoFilePath.mockResolvedValue(null);
    const res = { sendFile: jest.fn() };

    await expect(controller.serveLogo('palos-de-lena', res as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('serveLogo sends file when logo exists', async () => {
    serviceMock.resolveLogoFilePath.mockResolvedValue('/tmp/logo.png');
    const res = { sendFile: jest.fn() };

    await controller.serveLogo('palos-de-lena', res as never);

    expect(res.sendFile).toHaveBeenCalledWith('/tmp/logo.png');
  });
});
