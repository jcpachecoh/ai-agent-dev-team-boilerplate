import { builder } from '../builder';
import { UserObject } from './user';
import { requireAuth } from '../../auth/roles.guard';

builder.queryField('me', (t) =>
  t.field({
    type: UserObject,
    nullable: true,
    description: 'Returns the currently authenticated operational user',
    authScopes: { isAuthenticated: true },
    resolve: async (_root, _args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.prisma.operationalUser.findUnique({ where: { id: user.id } });
    },
  }),
);
