import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function withQueryClient(ui: ReactElement, client = createTestQueryClient()): ReactElement {
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

export function TestQueryProvider({
  children,
  client = createTestQueryClient(),
}: {
  children: ReactNode;
  client?: QueryClient;
}): React.JSX.Element {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
