import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const mockContext = (isPublic: boolean | undefined) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({}) }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard, Reflector],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
    jest.clearAllMocks();
  });

  it('returns true immediately for @Public() routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = mockContext(true);
    const result = guard.canActivate(context);
    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, expect.any(Array));
  });

  it('delegates to passport jwt strategy for protected routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    // super.canActivate would call passport — we spy to prevent actual jwt validation
    const superActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    const context = mockContext(false);
    const result = guard.canActivate(context);
    expect(result).toBe(true);
    superActivate.mockRestore();
  });

  it('getRequest returns HTTP request for non-graphql contexts', () => {
    const req = { headers: {} };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    expect(guard.getRequest(context)).toBe(req);
  });

  it('getRequest returns GraphQL request from execution context', () => {
    const req = { headers: {} };
    const context = { getType: () => 'graphql' } as unknown as ExecutionContext;
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req }),
    } as GqlExecutionContext);

    expect(guard.getRequest(context)).toBe(req);
  });
});
