/**
 * AUTH-02 schema guard — legacy Prisma GraphQL auth removed; delegate fields only.
 */

import { schema } from '../../src/schema';

describe('GraphQL auth schema (AUTH-02)', () => {
  const mutationFields = Object.keys(schema.getMutationType()?.getFields() ?? {});
  const queryFields = Object.keys(schema.getQueryType()?.getFields() ?? {});

  it('exposes global auth mutations', () => {
    expect(mutationFields).toEqual(
      expect.arrayContaining([
        'signup',
        'login',
        'logout',
        'refreshToken',
        'verifyEmail',
        'changePassword',
        'forgotPassword',
        'resetPassword',
        'resendVerification',
      ]),
    );
  });

  it('exposes operational auth mutations', () => {
    expect(mutationFields).toEqual(
      expect.arrayContaining(['loginOperational', 'logoutOperational']),
    );
  });

  it('does not expose legacy Prisma auth mutations', () => {
    expect(mutationFields).not.toContain('loginWithPin');
    expect(mutationFields).not.toContain('logoutOperationalLegacy');
    expect(mutationFields).not.toContain('refreshOperationalTokenLegacy');
  });

  it('exposes global and operational me queries', () => {
    expect(queryFields).toEqual(expect.arrayContaining(['me', 'meOperational']));
  });

  it('does not expose legacy AuthResponse type', () => {
    expect(schema.getType('AuthResponse')).toBeUndefined();
  });
});
