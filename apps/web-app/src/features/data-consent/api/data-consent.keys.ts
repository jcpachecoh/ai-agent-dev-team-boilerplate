export const dataConsentKeys = {
  all: ['data-consent'] as const,
  employee: (userId: string) => [...dataConsentKeys.all, 'employee', userId] as const,
  policy: () => [...dataConsentKeys.all, 'policy'] as const,
};
