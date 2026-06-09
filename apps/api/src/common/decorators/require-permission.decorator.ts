import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/** Require a single permission code (AND semantics when combined with @RequirePermissions). */
export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, [permission]);

/** Require all listed permission codes (AND semantics). */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
