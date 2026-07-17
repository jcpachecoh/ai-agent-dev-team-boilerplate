import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps): React.JSX.Element {
  return (
    <span
      className={cn('inline-flex items-center gap-2 text-xl font-bold tracking-tight', className)}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="28" height="28" rx="8" fill="currentColor" fillOpacity="0.12" />
        <path
          d="M8 18.5 12.2 9.5 16.4 15.5 20 8.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      OpsSync
    </span>
  );
}
