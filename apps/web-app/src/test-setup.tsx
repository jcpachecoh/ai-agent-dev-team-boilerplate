import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

import { AllProviders } from '@/test-utils/providers';

function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string) {
      return store[key] ?? null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageMock());
});

vi.mock('@testing-library/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@testing-library/react')>();

  const renderWithProviders: typeof actual.render = (ui, options) => {
    const { wrapper: Wrapper, ...rest } = options ?? {};

    return actual.render(ui, {
      ...rest,
      wrapper: ({ children }) => {
        if (Wrapper) {
          return (
            <AllProviders>
              <Wrapper>{children}</Wrapper>
            </AllProviders>
          );
        }
        return <AllProviders>{children}</AllProviders>;
      },
    });
  };

  return {
    ...actual,
    render: renderWithProviders,
  };
});
