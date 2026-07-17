/** tenantScope value used for global (tenantId = null) rows — OS-585 / OS-612. */
export const GLOBAL_TENANT_SCOPE = 'GLOBAL';

export function toTenantScope(tenantId: string | null | undefined): string {
  return tenantId ?? GLOBAL_TENANT_SCOPE;
}
