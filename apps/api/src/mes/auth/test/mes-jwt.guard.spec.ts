import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { MesJwtGuard } from '../guards/mes-jwt.guard';

describe('MesJwtGuard', () => {
  let guard: MesJwtGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MesJwtGuard],
    }).compile();

    guard = module.get<MesJwtGuard>(MesJwtGuard);
  });

  it('is defined', () => {
    expect(guard).toBeDefined();
  });

  it('uses the mes-jwt Passport strategy', () => {
    expect(guard).toBeInstanceOf(MesJwtGuard);
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
