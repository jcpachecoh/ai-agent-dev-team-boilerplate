export const sedesKeys = {
  all: ['sedes'] as const,
  lists: () => [...sedesKeys.all, 'list'] as const,
  list: (restaurantId: string) => [...sedesKeys.lists(), restaurantId] as const,
  details: () => [...sedesKeys.all, 'detail'] as const,
  detail: (restaurantId: string, id: string) => [...sedesKeys.details(), restaurantId, id] as const,
  users: (restaurantId: string, locationId: string) =>
    [...sedesKeys.detail(restaurantId, locationId), 'users'] as const,
};
