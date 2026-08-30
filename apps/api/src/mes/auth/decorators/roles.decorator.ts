import { SetMetadata } from '@nestjs/common';
import type { OperationalRole } from '@prisma/client';

export const MES_ROLES_KEY = 'mesRoles';

export const Roles = (...roles: OperationalRole[]) => SetMetadata(MES_ROLES_KEY, roles);
