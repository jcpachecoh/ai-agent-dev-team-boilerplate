/**
 * AUTH-03 Task 03 — GraphQL auth output types must not expose stored secrets.
 * Source inspection avoids the broken ../builder resolver test harness.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const AUTH_TYPES_PATH = join(__dirname, '../../src/schema/auth/auth.types.ts');
const GLOBAL_AUTH_MUTATION_PATH = join(__dirname, '../../src/schema/auth/global-auth.mutation.ts');
const OPERATIONAL_AUTH_MUTATION_PATH = join(
  __dirname,
  '../../src/schema/auth/operational-auth.mutation.ts',
);

const FORBIDDEN_EXPOSES = ['passwordHash', 'pinHash', 'cedulaHash', 'tokenHash'];

describe('GraphQL auth.types security (AUTH-03)', () => {
  const authTypesSource = readFileSync(AUTH_TYPES_PATH, 'utf8');

  it('GlobalUserShape interface omits password and token hash fields', () => {
    expect(authTypesSource).toMatch(/export interface GlobalUserShape/);
    for (const field of FORBIDDEN_EXPOSES) {
      expect(authTypesSource).not.toMatch(new RegExp(`GlobalUserShape[\\s\\S]*?\\b${field}\\b:`));
    }
  });

  it('OperationalUserShape interface omits pinHash and cedulaHash', () => {
    expect(authTypesSource).toMatch(/export interface OperationalUserShape/);
    expect(authTypesSource).not.toMatch(/OperationalUserShape[\s\S]*?pinHash:/);
    expect(authTypesSource).not.toMatch(/OperationalUserShape[\s\S]*?cedulaHash:/);
  });

  it('GlobalAuthTokens exposes only accessToken and refreshToken JWT fields', () => {
    const globalTokensBlock = authTypesSource.slice(
      authTypesSource.indexOf('GlobalAuthTokensObject.implement'),
      authTypesSource.indexOf('GlobalUserObject.implement'),
    );
    expect(globalTokensBlock).toMatch(/accessToken:\s*t\.exposeString/);
    expect(globalTokensBlock).toMatch(/refreshToken:\s*t\.exposeString/);
    for (const field of FORBIDDEN_EXPOSES) {
      expect(globalTokensBlock).not.toContain(field);
    }
  });

  it('OperationalAuthTokens operator field uses OperationalUserObject only', () => {
    expect(authTypesSource).toMatch(/type:\s*OperationalUserObject/);
    expect(authTypesSource).not.toMatch(/exposeString\('pinHash'/);
    expect(authTypesSource).not.toMatch(/exposeString\('cedulaHash'/);
  });
});

describe('GraphQL auth delegation (no local security logic)', () => {
  it('global auth mutations delegate via ApiClient, not bcrypt', () => {
    const source = readFileSync(GLOBAL_AUTH_MUTATION_PATH, 'utf8');
    expect(source).toMatch(/ctx\.services\.api\./);
    expect(source).not.toMatch(/bcrypt/);
    expect(source).not.toMatch(/@prisma\/client/);
  });

  it('operational auth mutations delegate via ApiClient', () => {
    const source = readFileSync(OPERATIONAL_AUTH_MUTATION_PATH, 'utf8');
    expect(source).toMatch(/ctx\.services\.api\./);
    expect(source).not.toMatch(/bcrypt/);
  });
});
