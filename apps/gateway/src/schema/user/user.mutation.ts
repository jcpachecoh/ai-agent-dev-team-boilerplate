import { builder } from '../builder';
import { UserObject } from './user';
import { requireAuth } from '../../auth/roles.guard';

const UpdateProfileInput = builder.inputType('UpdateProfileInput', {
  fields: (t) => ({
    sedeId: t.string({ required: false }),
  }),
});

builder.mutationField('updateProfile', (t) =>
  t.field({
    type: UserObject,
    description: 'Update the current user profile (e.g. change sede assignment)',
    authScopes: { isAuthenticated: true },
    args: {
      input: t.arg({ type: UpdateProfileInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);

      return ctx.prisma.operationalUser.update({
        where: { id: user.id },
        data: {
          ...(args.input.sedeId !== undefined ? { sedeId: args.input.sedeId } : {}),
        },
      });
    },
  }),
);
