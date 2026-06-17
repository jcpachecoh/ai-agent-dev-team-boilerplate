import type { WebLoginSize, WebLoginTheme } from './web-login-types';

export function webLoginSurfaceClass(
  baseClass: string,
  styles: Record<string, string>,
  options: {
    theme?: WebLoginTheme;
    size?: WebLoginSize;
    className?: string;
  },
): string {
  const { theme = 'dark', size = 'md', className } = options;
  return [baseClass, styles[`theme--${theme}`], styles[`size--${size}`], className]
    .filter(Boolean)
    .join(' ');
}
