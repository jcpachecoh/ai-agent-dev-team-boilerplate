export const plantKeys = {
  all: ['plant'] as const,
  recipes: () => [...plantKeys.all, 'recipes'] as const,
  recipe: (id: string) => [...plantKeys.all, 'recipe', id] as const,
  orders: () => [...plantKeys.all, 'orders'] as const,
  workstations: () => [...plantKeys.all, 'workstations'] as const,
  categories: (isActive?: boolean) => [...plantKeys.all, 'categories', isActive ?? 'all'] as const,
};
