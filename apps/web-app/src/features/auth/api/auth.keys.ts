export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  myLocations: () => [...authKeys.all, 'my-locations'] as const,
};
