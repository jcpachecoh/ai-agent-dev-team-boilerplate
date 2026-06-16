import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { createChildLogger } from './logging';

const log = createChildLogger('errors');

export class AuthenticationError extends GraphQLError {
  constructor(message = 'Not authenticated') {
    super(message, {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}

export class AuthorizationError extends GraphQLError {
  constructor(message = 'Not authorized') {
    super(message, {
      extensions: { code: 'FORBIDDEN', http: { status: 403 } },
    });
    Object.defineProperty(this, 'name', { value: 'AuthorizationError' });
  }
}

export class NotFoundError extends GraphQLError {
  constructor(resource = 'Resource', id?: string) {
    const msg = id ? `${resource} with id "${id}" not found` : `${resource} not found`;
    super(msg, {
      extensions: { code: 'NOT_FOUND', http: { status: 404 } },
    });
    Object.defineProperty(this, 'name', { value: 'NotFoundError' });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, {
      extensions: { code: 'BAD_USER_INPUT', http: { status: 400 }, fields },
    });
    Object.defineProperty(this, 'name', { value: 'ValidationError' });
  }
}

export class RateLimitError extends GraphQLError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, {
      extensions: { code: 'RATE_LIMITED', http: { status: 429 } },
    });
    Object.defineProperty(this, 'name', { value: 'RateLimitError' });
  }
}

export class ConflictError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: { code: 'CONFLICT', http: { status: 409 } },
    });
    Object.defineProperty(this, 'name', { value: 'ConflictError' });
  }
}

export function formatError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  // Log unexpected errors
  if (error instanceof GraphQLError) {
    const code = error.extensions?.['code'] as string | undefined;
    const isClientError = [
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'BAD_USER_INPUT',
      'RATE_LIMITED',
      'CONFLICT',
    ].includes(code ?? '');

    if (!isClientError) {
      log.error({ err: error, path: formattedError.path }, 'Unexpected GraphQL error');
    }
  } else {
    log.error({ err: error }, 'Unknown error in GraphQL execution');
  }

  // In production, mask internal errors
  if (process.env['NODE_ENV'] === 'production') {
    const code = formattedError.extensions?.['code'] as string | undefined;
    if (!code || code === 'INTERNAL_SERVER_ERROR') {
      return {
        message: 'Internal server error',
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      };
    }
  }

  return formattedError;
}
