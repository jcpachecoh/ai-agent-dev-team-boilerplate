import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CurrentUser } from '../current-user.decorator';

function getDecoratorFactory(): (_data: unknown, ctx: ExecutionContext) => unknown {
  class TestHost {
    handler(@CurrentUser() _user: unknown) {}
  }
  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestHost, 'handler');
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

describe('CurrentUser', () => {
  const factory = getDecoratorFactory();

  it('reads user from GraphQL request context', () => {
    const gqlUser = { id: 'gql-user' };
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user: gqlUser } }),
    } as ReturnType<typeof GqlExecutionContext.create>);

    const context = { getType: () => 'graphql' } as ExecutionContext;

    expect(factory(null, context)).toBe(gqlUser);
  });

  it('reads user from HTTP request when not GraphQL', () => {
    const httpUser = { id: 'http-user' };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({ user: httpUser }),
      }),
    } as ExecutionContext;

    expect(factory(null, context)).toBe(httpUser);
  });
});
