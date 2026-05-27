import { OperationalRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { MesAuthController } from '../controller/mes-auth.controller';
import { MesAuthService } from '../service/mes-auth.service';

const meResponse = {
  id: 'op-user-1',
  role: OperationalRole.OPERATOR,
  tenantId: 'tenant-abc',
  sedeId: null,
};

const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token', operator: meResponse };

const serviceMock = {
  login: jest.fn(),
  logout: jest.fn(),
  me: jest.fn(),
  getRole: jest.fn(),
};

const buildRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    ip: '192.168.1.10',
    socket: { remoteAddress: '10.0.0.1' },
    headers: {},
    ...overrides,
  }) as Request;

describe('MesAuthController', () => {
  let controller: MesAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MesAuthController],
      providers: [{ provide: MesAuthService, useValue: serviceMock }],
    }).compile();

    controller = module.get<MesAuthController>(MesAuthController);
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('calls service.login with dto, IP, and x-tenant-id', async () => {
      serviceMock.login.mockResolvedValue(tokens);
      const dto = { cedula: '12345678', pin: '1234' };
      const req = buildRequest({ ip: '203.0.113.5' });

      const result = await controller.login(dto, 'tenant-abc', req);

      expect(result).toEqual(tokens);
      expect(serviceMock.login).toHaveBeenCalledWith(dto, '203.0.113.5', 'tenant-abc');
    });

    it('uses x-forwarded-for when present', async () => {
      serviceMock.login.mockResolvedValue(tokens);
      const dto = { cedula: '12345678', pin: '1234' };
      const req = buildRequest({
        headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.1' },
      });

      await controller.login(dto, 'tenant-abc', req);

      expect(serviceMock.login).toHaveBeenCalledWith(dto, '198.51.100.1', 'tenant-abc');
    });
  });

  describe('logout', () => {
    it('passes req.user.sub and req.user.jti to service.logout', async () => {
      serviceMock.logout.mockResolvedValue(undefined);
      const req = {
        user: {
          sub: 'op-user-1',
          jti: 'jti-xyz',
          cedulaHash: 'hash',
          role: OperationalRole.OPERATOR,
          tenantId: 'tenant-abc',
          sedeId: null,
        },
      } as never;

      const result = await controller.logout(req);

      expect(serviceMock.logout).toHaveBeenCalledWith('op-user-1', 'jti-xyz');
      expect(result).toEqual({ message: 'Logged out successfully.' });
    });
  });

  describe('me', () => {
    it('calls service.me with req.user.sub', async () => {
      serviceMock.me.mockResolvedValue(meResponse);
      const req = { user: { sub: 'op-user-1' } } as never;

      const result = await controller.me(req);

      expect(result).toEqual(meResponse);
      expect(serviceMock.me).toHaveBeenCalledWith('op-user-1');
    });
  });

  describe('getRole', () => {
    it('calls service.getRole with requester sub and route userId', async () => {
      serviceMock.getRole.mockResolvedValue({ role: OperationalRole.MANAGER });
      const req = { user: { sub: 'op-user-1' } } as never;

      const result = await controller.getRole('target-user-99', req);

      expect(result).toEqual({ role: OperationalRole.MANAGER });
      expect(serviceMock.getRole).toHaveBeenCalledWith('op-user-1', 'target-user-99');
    });
  });
});
