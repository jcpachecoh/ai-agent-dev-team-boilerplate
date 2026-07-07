export const usuariosKeys = {
  all: ['admin-usuarios'] as const,
  list: (includeInactive = false) => [...usuariosKeys.all, 'list', includeInactive] as const,
  detail: (id: string) => [...usuariosKeys.all, 'detail', id] as const,
  roles: () => [...usuariosKeys.all, 'roles'] as const,
};
