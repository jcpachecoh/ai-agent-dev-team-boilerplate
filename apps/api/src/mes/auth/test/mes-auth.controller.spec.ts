import { OperationalRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { MesAuthController } from '../controller/mes-auth.controller';
import { MesAuthService } from '../service/mes-auth.service';

const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

const meResponse = {
  id: 'op-user-1',
  role: OperationalRole.OPERATOR,
  tenantId: 'tenant-abc',
  sedeId: null,
};

const serviceMock = {
  login: jest.fn(),
  logout: jest.fn(),
  me: jest.fn(),
  getRole: jest.fn(),
  createUser: jest.fn(),
};

const buildRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    ip: '192.168.1.10',
    socket: { remoteAddress: '10.0.0.1' },
    headers: { 'user-agent': 'Mozilla/5.0' },
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
    it('calls service.login with dto, IP, tenant and userAgent', async () => {
      serviceMock.login.mockResolvedValue(tokens);
      const dto = { cedula: '12345678', pin: '1234' };
      const req = buildRequest({ ip: '203.0.113.5' });

      const result = await controller.login(dto, 'tenant-abc', req);

      expect(result).toEqual(tokens);
      expect(result).not.toHaveProperty('pinHash');
      expect(result).not.toHaveProperty('cedulaHash');
      expect(serviceMock.login).toHaveBeenCalledWith(
        dto,
        '203.0.113.5',
        'tenant-abc',
        'Mozilla/5.0',
      );
    });

    it('uses x-forwarded-for when present', async () => {
      serviceMock.login.mockResolvedValue(tokens);
      const dto = { cedula: '12345678', pin: '1234' };
      const req = buildRequest({
        headers: {
          'x-forwarded-for': '198.51.100.1, 10.0.0.1',
          'user-agent': 'Chrome',
        },
      });

      await controller.login(dto, 'tenant-abc', req);

      expect(serviceMock.login).toHaveBeenCalledWith(dto, '198.51.100.1', 'tenant-abc', 'Chrome');
    });
  });

  describe('logout', () => {
    it('passes req.user.sub, req.user.jti, IP and userAgent to service.logout', async () => {
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
        ip: '10.0.0.5',
        socket: { remoteAddress: '10.0.0.1' },
        headers: { 'user-agent': 'Safari' },
      } as never;

      const result = await controller.logout(req);

      expect(serviceMock.logout).toHaveBeenCalledWith('op-user-1', 'jti-xyz', '10.0.0.5', 'Safari');
      expect(result).toEqual({ message: 'Logged out successfully.' });
    });
  });

  describe('me', () => {
    it('calls service.me with req.user.sub', async () => {
      serviceMock.me.mockResolvedValue(meResponse);
      const req = { user: { sub: 'op-user-1' } } as never;

      const result = await controller.me(req);

      expect(result).toEqual(meResponse);
      expect(result).not.toHaveProperty('pinHash');
      expect(result).not.toHaveProperty('cedulaHash');
      expect(serviceMock.me).toHaveBeenCalledWith('op-user-1');
    });
  });

  describe('createUser', () => {
    it('calls service.createUser with requester sub and dto', async () => {
      const created = {
        id: 'new-op-1',
        cedula: '****4321',
        role: OperationalRole.OPERATOR,
        tenantId: 'tenant-abc',
        sedeId: 'sede-principal',
      };
      serviceMock.createUser.mockResolvedValue(created);
      const dto = {
        cedula: '87654321',
        pin: '4321',
        role: OperationalRole.OPERATOR,
        sedeId: 'sede-principal',
      };
      const req = { user: { sub: 'owner-1' } } as never;

      const result = await controller.createUser(dto, req);

      expect(result).toEqual(created);
      expect(serviceMock.createUser).toHaveBeenCalledWith('owner-1', dto);
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
