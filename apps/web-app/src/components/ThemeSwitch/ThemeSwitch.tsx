import { Switch } from '@restopsiq/ui';
import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/providers/ThemeProvider';

import styles from './ThemeSwitch.module.scss';

export default function ThemeSwitch(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={styles.root}>
      <Sun size={14} className={styles.icon} aria-hidden />
      <Switch
        theme={theme}
        size="sm"
        checked={isDark}
        onChange={(checked: boolean) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Cambiar tema claro u oscuro"
      />
      <Moon size={14} className={styles.icon} aria-hidden />
    </div>
  );
}
