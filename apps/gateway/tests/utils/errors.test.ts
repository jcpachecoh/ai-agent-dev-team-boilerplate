/**
 * Error utility tests
 *
 * Covers all custom GraphQL error classes and the formatError formatter.
 */

import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ConflictError,
  formatError,
} from '../../src/utils/errors';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

// ─── Error classes ────────────────────────────────────────────────────────────

describe('AuthenticationError', () => {
  it('has UNAUTHENTICATED code and 401 status', () => {
    const err = new AuthenticationError();
    expect(err.message).toBe('Not authenticated');
    expect(err.extensions['code']).toBe('UNAUTHENTICATED');
    expect((err.extensions['http'] as { status: number }).status).toBe(401);
    expect(err.name).toBe('AuthenticationError');
  });

  it('accepts a custom message', () => {
    const err = new AuthenticationError('Token expired');
    expect(err.message).toBe('Token expired');
  });
});

describe('AuthorizationError', () => {
  it('has FORBIDDEN code and 403 status', () => {
    const err = new AuthorizationError();
    expect(err.message).toBe('Not authorized');
    expect(err.extensions['code']).toBe('FORBIDDEN');
    expect((err.extensions['http'] as { status: number }).status).toBe(403);
    expect(err.name).toBe('AuthorizationError');
  });
});

describe('NotFoundError', () => {
  it('formats message with resource and id', () => {
    const err = new NotFoundError('Supplier', 'sup-1');
    expect(err.message).toBe('Supplier with id "sup-1" not found');
    expect(err.extensions['code']).toBe('NOT_FOUND');
    expect((err.extensions['http'] as { status: number }).status).toBe(404);
    expect(err.name).toBe('NotFoundError');
  });

  it('formats message without id', () => {
    const err = new NotFoundError('Recipe');
    expect(err.message).toBe('Recipe not found');
  });
});

describe('ValidationError', () => {
  it('has BAD_USER_INPUT code and 400 status', () => {
    const err = new ValidationError('Name is required', { name: ['Name is required'] });
    expect(err.extensions['code']).toBe('BAD_USER_INPUT');
    expect((err.extensions['http'] as { status: number }).status).toBe(400);
    expect(err.extensions['fields']).toEqual({ name: ['Name is required'] });
    expect(err.name).toBe('ValidationError');
  });
});

describe('RateLimitError', () => {
  it('has RATE_LIMITED code and 429 status', () => {
    const err = new RateLimitError();
    expect(err.extensions['code']).toBe('RATE_LIMITED');
    expect((err.extensions['http'] as { status: number }).status).toBe(429);
    expect(err.name).toBe('RateLimitError');
  });
});

describe('ConflictError', () => {
  it('has CONFLICT code and 409 status', () => {
    const err = new ConflictError('Already exists');
    expect(err.message).toBe('Already exists');
    expect(err.extensions['code']).toBe('CONFLICT');
    expect((err.extensions['http'] as { status: number }).status).toBe(409);
    expect(err.name).toBe('ConflictError');
  });
});

// ─── formatError ─────────────────────────────────────────────────────────────

describe('formatError', () => {
  const originalEnv = process.env['NODE_ENV'];
  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv;
  });

  function makeFormatted(code?: string): GraphQLFormattedError {
    return {
      message: 'Some error',
      extensions: code ? { code } : undefined,
    };
  }

  it('passes through client GraphQL errors unchanged', () => {
    const gqlErr = new AuthenticationError('Not logged in');
    const formatted = makeFormatted('UNAUTHENTICATED');
    const result = formatError(formatted, gqlErr);
    expect(result).toBe(formatted);
  });

  it('passes through non-client GraphQL errors unchanged in development', () => {
    process.env['NODE_ENV'] = 'development';
    const gqlErr = new GraphQLError('Internal failure');
    const formatted = makeFormatted('INTERNAL_SERVER_ERROR');
    const result = formatError(formatted, gqlErr);
    expect(result).toBe(formatted);
  });

  it('masks INTERNAL_SERVER_ERROR in production', () => {
    process.env['NODE_ENV'] = 'production';
    const gqlErr = new GraphQLError('DB connection failed');
    const formatted = makeFormatted('INTERNAL_SERVER_ERROR');
    const result = formatError(formatted, gqlErr);
    expect(result.message).toBe('Internal server error');
    expect(result.extensions?.['code']).toBe('INTERNAL_SERVER_ERROR');
  });

  it('masks error without a code in production', () => {
    process.env['NODE_ENV'] = 'production';
    const gqlErr = new GraphQLError('Something went wrong');
    const formatted = makeFormatted();
    const result = formatError(formatted, gqlErr);
    expect(result.message).toBe('Internal server error');
  });

  it('preserves client errors in production unchanged', () => {
    process.env['NODE_ENV'] = 'production';
    const gqlErr = new NotFoundError('User', 'u-1');
    const formatted = makeFormatted('NOT_FOUND');
    const result = formatError(formatted, gqlErr);
    expect(result).toBe(formatted);
  });

  it('handles non-GraphQLError (plain Error) without throwing', () => {
    const plainErr = new Error('network timeout');
    const formatted = makeFormatted('INTERNAL_SERVER_ERROR');
    expect(() => formatError(formatted, plainErr)).not.toThrow();
  });
});
