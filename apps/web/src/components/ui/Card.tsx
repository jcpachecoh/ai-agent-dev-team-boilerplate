import { cn } from '@/lib/cn';

type CardVariant = 'glass' | 'light';

const VARIANT_STYLES: Record<CardVariant, string> = {
  glass: 'bg-white/5 backdrop-blur-md border border-white/10',
  light: 'bg-white border border-neutral-200 shadow-sm hover:shadow-md',
};

interface CardProps {
  variant?: CardVariant;
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = 'light',
  hover = false,
  children,
  className,
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        VARIANT_STYLES[variant],
        hover && 'transition-transform duration-300 hover:-translate-y-1',
        className,
      )}
    >
      {children}
    </div>
  );
}
