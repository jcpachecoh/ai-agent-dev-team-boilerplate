import type { UiTheme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';

export function useUiTheme(): UiTheme {
  return useTheme().theme;
}
