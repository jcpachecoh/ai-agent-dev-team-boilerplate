import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  applyPlantDocumentTheme,
  getInitialPlantTheme,
  PLANT_THEME_STORAGE_KEY,
  type PlantUiTheme,
} from '@/constants/theme';

interface ThemeContextValue {
  theme: PlantUiTheme;
  setTheme: (theme: PlantUiTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: PlantUiTheme;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps): React.JSX.Element {
  const [theme, setThemeState] = useState<PlantUiTheme>(
    () => initialTheme ?? getInitialPlantTheme(),
  );

  useEffect(() => {
    applyPlantDocumentTheme(theme);
    try {
      localStorage.setItem(PLANT_THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage may be unavailable
    }
  }, [theme]);

  const setTheme = useCallback((next: PlantUiTheme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
