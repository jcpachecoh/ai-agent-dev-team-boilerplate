import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../strategies/jwt-refresh.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('returns the enriched payload unchanged', () => {
    const payload = {
      sub: 'user-1',
      email: 'a@b.com',
      tenantId: 'palos-de-lena',
      roleId: 'role-1',
      roleCode: 'OPERATOR',
    };
    expect(strategy.validate(payload)).toEqual(payload);
  });
});

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;

  beforeEach(() => {
    strategy = new JwtRefreshStrategy();
  });

  it('extracts refreshToken from Authorization header and merges with payload', () => {
    const payload = {
      sub: 'user-1',
      email: 'a@b.com',
      tenantId: 'palos-de-lena',
      roleId: 'role-1',
      roleCode: 'OPERATOR',
    };
    const req = { get: (h: string) => (h === 'Authorization' ? 'Bearer my-refresh' : '') } as never;
    const result = strategy.validate(req, payload);
    expect(result).toMatchObject({
      sub: 'user-1',
      email: 'a@b.com',
      tenantId: 'palos-de-lena',
      roleId: 'role-1',
      roleCode: 'OPERATOR',
      refreshToken: 'my-refresh',
    });
  });

  it('stores empty string when Authorization header is absent', () => {
    const payload = {
      sub: 'user-1',
      email: 'a@b.com',
      tenantId: 'palos-de-lena',
      roleId: 'role-1',
      roleCode: 'OPERATOR',
    };
    const req = { get: () => '' } as never;
    const result = strategy.validate(req, payload);
    expect(result.refreshToken).toBe('');
  });

  it('stores empty string when Authorization header returns undefined', () => {
    const payload = {
      sub: 'user-1',
      email: 'a@b.com',
      tenantId: 'palos-de-lena',
      roleId: 'role-1',
      roleCode: 'OPERATOR',
    };
    const req = { get: () => undefined } as never;
    const result = strategy.validate(req, payload);
    expect(result.refreshToken).toBe('');
  });
});
