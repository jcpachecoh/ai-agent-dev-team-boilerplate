import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../strategies/jwt-refresh.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('returns the payload unchanged', () => {
    const payload = { sub: 'user-1', email: 'a@b.com' };
    expect(strategy.validate(payload)).toEqual(payload);
  });
});

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;

  beforeEach(() => {
    strategy = new JwtRefreshStrategy();
  });

  it('extracts refreshToken from Authorization header and merges with payload', () => {
    const payload = { sub: 'user-1', email: 'a@b.com' };
    const req = { get: (h: string) => (h === 'Authorization' ? 'Bearer my-refresh' : '') } as never;
    const result = strategy.validate(req, payload);
    expect(result).toMatchObject({ sub: 'user-1', email: 'a@b.com', refreshToken: 'my-refresh' });
  });

  it('stores empty string when Authorization header is absent', () => {
    const payload = { sub: 'user-1', email: 'a@b.com' };
    const req = { get: () => '' } as never;
    const result = strategy.validate(req, payload);
    expect(result.refreshToken).toBe('');
  });
});
