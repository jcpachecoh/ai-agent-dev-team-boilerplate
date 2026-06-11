import { Test, TestingModule } from '@nestjs/testing';
import { MesAuthResolver } from '../resolver/mes-auth.resolver';
import { MesAuthService } from '../service/mes-auth.service';

const tenantId = 'palos-de-lena';

const gqlContext = {
  req: {
    headers: {
      'x-tenant-id': tenantId,
      'x-forwarded-for': '203.0.113.20',
      'user-agent': 'jest',
    },
  },
};

const mesAuthServiceMock = {
  login: jest.fn(),
  logout: jest.fn(),
  me: jest.fn(),
};

describe('MesAuthResolver', () => {
  let resolver: MesAuthResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MesAuthResolver, { provide: MesAuthService, useValue: mesAuthServiceMock }],
    }).compile();

    resolver = module.get<MesAuthResolver>(MesAuthResolver);
    jest.clearAllMocks();
  });

  it('delegates loginOperational to MesAuthService', async () => {
    const tokens = {
      accessToken: 'mes-a',
      refreshToken: 'mes-r',
      operator: { id: 'op-1', role: 'OPERATOR', tenantId, sedeId: null },
    };
    mesAuthServiceMock.login.mockResolvedValue(tokens);

    const result = await resolver.loginOperational(gqlContext, { cedula: '12345678', pin: '1234' });

    expect(result).toEqual(tokens);
    expect(mesAuthServiceMock.login).toHaveBeenCalledWith(
      { cedula: '12345678', pin: '1234' },
      '203.0.113.20',
      tenantId,
      'jest',
    );
  });

  it('delegates logoutOperational with IP and user-agent from context', async () => {
    mesAuthServiceMock.logout.mockResolvedValue(undefined);

    await resolver.logoutOperational(gqlContext, {
      sub: 'op-1',
      cedulaHash: 'hash',
      role: 'OPERATOR',
      sedeId: null,
      tenantId,
      jti: 'jti-1',
    });

    expect(mesAuthServiceMock.logout).toHaveBeenCalledWith('op-1', 'jti-1', '203.0.113.20', 'jest');
  });

  it('delegates meOperational to MesAuthService', async () => {
    const profile = { id: 'op-1', role: 'OPERATOR', tenantId, sedeId: null };
    mesAuthServiceMock.me.mockResolvedValue(profile);

    const result = await resolver.meOperational({
      sub: 'op-1',
      cedulaHash: 'hash',
      role: 'OPERATOR',
      sedeId: null,
      tenantId,
    });

    expect(result).toEqual(profile);
    expect(mesAuthServiceMock.me).toHaveBeenCalledWith('op-1');
  });
});
