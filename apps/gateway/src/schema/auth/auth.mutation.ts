import { OperationalUser } from '@prisma/client';
import { builder } from '../builder';
import { UserObject } from '../user/user';
import { authService } from '../../auth/auth.service';
import { requireAuth } from '../../auth/roles.guard';
import { validate, LoginSchema } from '../../utils/validation';

// ─── AuthResponse shape ───────────────────────────────────────────────────────

interface AuthResponseShape {
  token: string;
  user: OperationalUser;
}

const AuthResponseRef = builder.objectRef<AuthResponseShape>('AuthResponse');

AuthResponseRef.implement({
  description: 'Successful authentication result',
  fields: (t) => ({
    token: t.exposeString('token'),
    user: t.field({ type: UserObject, resolve: (r) => r.user }),
  }),
});

// ─── Mutation type ────────────────────────────────────────────────────────────

builder.mutationType({
  fields: (t) => ({
    login: t.field({
      type: AuthResponseRef,
      description: 'Authenticate an operational user with cédula + PIN',
      args: {
        cedula: t.arg.string({ required: true }),
        pin: t.arg.string({ required: true }),
        tenantId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx) => {
        validate(LoginSchema, args);
        return ctx.services.auth.loginWithPin(args.cedula, args.pin, args.tenantId);
      },
    }),

    logout: t.boolean({
      description: 'Invalidate the current session (client must discard the token)',
      authScopes: { isAuthenticated: true },
      resolve: () => true,
    }),

    refreshToken: t.field({
      type: AuthResponseRef,
      description: 'Issue a fresh JWT for the currently authenticated user',
      authScopes: { isAuthenticated: true },
      resolve: async (_root, _args, ctx) => {
        const authUser = requireAuth(ctx.user);
        const dbUser = await ctx.services.auth.getUserById(authUser.id);

        const token = authService.signToken({
          sub: dbUser.id,
          tenantId: dbUser.tenantId,
          role: dbUser.role,
          sedeId: dbUser.sedeId ?? undefined,
        });

        return { token, user: dbUser };
      },
    }),
  }),
});
