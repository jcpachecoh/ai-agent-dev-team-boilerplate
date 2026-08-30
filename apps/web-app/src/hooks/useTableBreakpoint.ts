import { useMediaQuery } from '@/hooks/useMediaQuery';

export type TableBreakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export function useTableBreakpoint(): TableBreakpoint {
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isLaptop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 640px)');

  if (isDesktop) return 'desktop';
  if (isLaptop) return 'laptop';
  if (isTablet) return 'tablet';
  return 'mobile';
}
