import { cn } from '@/lib/cn';

export type BadgeColor =
  | 'accent'
  | 'emerald'
  | 'violet'
  | 'brand'
  | 'cyan'
  | 'amber'
  | 'rose'
  | 'indigo';

const COLOR_STYLES: Record<BadgeColor, string> = {
  accent: 'bg-accent-500/10 text-accent-600 border-accent-500/20',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  brand: 'bg-brand-500/10 text-brand-600 border-brand-500/20',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

interface BadgeProps {
  color?: BadgeColor;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ color = 'brand', children, className }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        COLOR_STYLES[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
