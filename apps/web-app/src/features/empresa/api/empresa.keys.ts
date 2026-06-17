export const empresaKeys = {
  all: ['empresa'] as const,
  tenant: (scope: string) => [...empresaKeys.all, 'tenant', scope] as const,
};
