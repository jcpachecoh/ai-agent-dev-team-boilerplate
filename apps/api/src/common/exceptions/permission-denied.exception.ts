import { ForbiddenException } from '@nestjs/common';

export const PERMISSION_DENIED_CODE = 'PERMISSION_DENIED';
export const PERMISSION_DENIED_MESSAGE = 'Permission denied';

/** REST / non-GraphQL permission denial (GraphQL uses GraphQLError with extensions in the guard). */
export class PermissionDeniedException extends ForbiddenException {
  constructor() {
    super(PERMISSION_DENIED_MESSAGE);
  }
}
