export const rolesKeys = {
  all: ['admin-roles'] as const,
  list: (includeInactive = false) => [...rolesKeys.all, 'list', includeInactive] as const,
  detail: (id: string) => [...rolesKeys.all, 'detail', id] as const,
  permissions: () => [...rolesKeys.all, 'permissions'] as const,
};
