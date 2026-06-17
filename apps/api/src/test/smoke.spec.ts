import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthResolver } from '../auth/resolver/auth.resolver';
import { AuthService } from '../auth/service/auth.service';
import { AuthEmailService } from '../auth/service/auth-email.service';
import { MesAuthResolver } from '../mes/auth/resolver/mes-auth.resolver';
import { MesAuthService } from '../mes/auth/service/mes-auth.service';
import { SupplierResolver } from '../supplier/resolver/supplier.resolver';
import { SupplierService } from '../supplier/service/supplier.service';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { PUB_SUB } from '../pubsub/pubsub.module';

describe('Smoke — unified apps/api', () => {
  describe('HTTP health', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [AppService],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /health returns ok', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);
      expect(response.body).toMatchObject({ status: 'ok' });
    });
  });

  describe('GraphQL auth contract (web-app / Postman folder 10)', () => {
    const tenantId = 'palos-de-lena';
    const authServiceMock = {
      login: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }),
      signup: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
      changePassword: jest.fn(),
      resetPassword: jest.fn(),
      findByTenantAndEmail: jest.fn(),
      refresh: jest.fn(),
    };

    let authResolver: AuthResolver;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthResolver,
          { provide: AuthService, useValue: authServiceMock },
          { provide: AuthEmailService, useValue: {} },
        ],
      }).compile();
      authResolver = module.get(AuthResolver);
    });

    it('login(input) resolves with tenant from x-tenant-id header', async () => {
      const context = { req: { headers: { 'x-tenant-id': tenantId } } };
      const result = await authResolver.login(context, {
        email: 'a@b.com',
        password: 'secret',
      });
      expect(result.accessToken).toBe('at');
      expect(authServiceMock.login).toHaveBeenCalledWith(
        tenantId,
        { email: 'a@b.com', password: 'secret' },
        'unknown',
        undefined,
      );
    });
  });

  describe('GraphQL suppliers (proveedores)', () => {
    const supplierServiceMock = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    let supplierResolver: SupplierResolver;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SupplierResolver,
          { provide: SupplierService, useValue: supplierServiceMock },
          { provide: PUB_SUB, useValue: { publish: jest.fn(), asyncIterator: jest.fn() } },
        ],
      }).compile();
      supplierResolver = module.get(SupplierResolver);
    });

    it('suppliers query uses x-tenant-id from context', async () => {
      await supplierResolver.suppliers({ req: { headers: { 'x-tenant-id': 'palos-de-lena' } } });
      expect(supplierServiceMock.findAll).toHaveBeenCalledWith(
        'palos-de-lena',
        expect.objectContaining({}),
      );
    });
  });

  describe('GraphQL operational auth', () => {
    const mesAuthServiceMock = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'mes-at',
        refreshToken: 'mes-rt',
        operator: { id: 'op-1', role: 'OPERATOR', tenantId: 'palos-de-lena', locationId: null },
        locations: [],
        requiresLocationSelection: false,
      }),
      logout: jest.fn(),
      me: jest.fn(),
    };

    let mesAuthResolver: MesAuthResolver;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [MesAuthResolver, { provide: MesAuthService, useValue: mesAuthServiceMock }],
      }).compile();
      mesAuthResolver = module.get(MesAuthResolver);
    });

    it('loginOperational(input) delegates to MesAuthService', async () => {
      const result = await mesAuthResolver.loginOperational(
        { req: { headers: { 'x-tenant-id': 'palos-de-lena' } } },
        { cedula: '12345678', pin: '1234' },
      );
      expect(result.accessToken).toBe('mes-at');
      expect(mesAuthServiceMock.login).toHaveBeenCalled();
    });
  });
});
