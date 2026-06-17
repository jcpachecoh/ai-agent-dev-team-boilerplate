import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { THEME_STORAGE_KEY } from '@/constants/theme';

import { ThemeProvider, useTheme } from './ThemeProvider';

function ThemeConsumer(): React.JSX.Element {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
      <button type="button" onClick={() => setTheme('light')}>
        Set light
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('uses initialTheme when provided', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggles between light and dark', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider initialTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('persists theme to localStorage', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider initialTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Set light' }));

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('reads saved theme from localStorage on mount', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });
});
