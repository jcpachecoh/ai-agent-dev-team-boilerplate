import { builder } from '../builder';
import { OperationalUser } from '@prisma/client';

/**
 * GraphQL type for OperationalUser (MES user authenticated via cédula + PIN).
 */
export const UserObject = builder.objectRef<OperationalUser>('User');

UserObject.implement({
  description: 'An operational user authenticated via cédula + PIN',
  fields: (t) => ({
    id: t.exposeID('id'),
    role: t.exposeString('role'),
    tenantId: t.exposeString('tenantId'),
    sedeId: t.exposeString('sedeId', { nullable: true }),
    isActive: t.exposeBoolean('isActive'),
    lastLoginAt: t.expose('lastLoginAt', { type: 'DateTime', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});
