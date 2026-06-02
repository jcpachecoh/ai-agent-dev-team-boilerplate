import { BaseService } from './base.service';

/**
 * Gateway auth service shell — operational login/logout delegated to apps/api via ApiClient.
 * Kept on Services for backward-compatible wiring; no Prisma auth methods remain.
 */
export class GatewayAuthService extends BaseService {}
