export const laborLegalParametersKeys = {
  all: ['labor-legal-parameters'] as const,
  list: () => [...laborLegalParametersKeys.all, 'list'] as const,
  history: (key: string) => [...laborLegalParametersKeys.all, 'history', key] as const,
};
