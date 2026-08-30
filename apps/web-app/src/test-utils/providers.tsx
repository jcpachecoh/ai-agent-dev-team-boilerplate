import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/providers/ThemeProvider';

import { createTestQueryClient } from './query-client';

export function AllProviders({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <ThemeProvider initialTheme="dark">
      <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
