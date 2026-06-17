/**
 * Error middleware tests
 *
 * Covers the Express error-handling middleware for 4xx and 5xx responses,
 * production masking, and response shape.
 */

import { errorMiddleware } from '../../src/middleware/error.middleware';
import type { Request, Response, NextFunction } from 'express';

function makeRes() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as jest.Mocked<Response>;
}

function makeReq(): Request {
  return {} as Request;
}

const noop: NextFunction = jest.fn();

describe('errorMiddleware', () => {
  const originalEnv = process.env['NODE_ENV'];

  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv;
  });

  it('responds with the error status and message for a 4xx error', () => {
    const res = makeRes();
    const err = Object.assign(new Error('Not found'), { status: 404 });

    errorMiddleware(err, makeReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Not found', status: 404 }),
      }),
    );
  });

  it('defaults to 500 when no status is set on the error', () => {
    const res = makeRes();
    errorMiddleware(new Error('boom'), makeReq(), res, noop);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('uses statusCode when status is not set', () => {
    const res = makeRes();
    const err = Object.assign(new Error('Conflict'), { statusCode: 409 });
    errorMiddleware(err, makeReq(), res, noop);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('masks 5xx message in production', () => {
    process.env['NODE_ENV'] = 'production';
    const res = makeRes();
    errorMiddleware(new Error('DB crashed'), makeReq(), res, noop);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Internal server error' }),
      }),
    );
  });

  it('does not mask 4xx messages in production', () => {
    process.env['NODE_ENV'] = 'production';
    const res = makeRes();
    const err = Object.assign(new Error('Bad request'), { status: 400 });
    errorMiddleware(err, makeReq(), res, noop);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Bad request' }),
      }),
    );
  });

  it('includes stack in development', () => {
    process.env['NODE_ENV'] = 'development';
    const res = makeRes();
    errorMiddleware(new Error('oops'), makeReq(), res, noop);

    const call = (res.json as jest.Mock).mock.calls[0][0] as { error: Record<string, unknown> };
    expect(call.error['stack']).toBeDefined();
  });

  it('omits stack in production', () => {
    process.env['NODE_ENV'] = 'production';
    const res = makeRes();
    const err = Object.assign(new Error('oops'), { status: 400 });
    errorMiddleware(err, makeReq(), res, noop);

    const call = (res.json as jest.Mock).mock.calls[0][0] as { error: Record<string, unknown> };
    expect(call.error['stack']).toBeUndefined();
  });
});
