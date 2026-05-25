import type { LucideIcon } from 'lucide-react';
import { createElement, type ReactNode } from 'react';

export interface LucideIconRenderProps {
  size?: number;
  strokeWidth?: number;
}

/** Renders lucide icons with Plant's React types (avoids duplicate @types/react JSX mismatches). */
export function renderLucideIcon(Icon: LucideIcon, props: LucideIconRenderProps = {}): ReactNode {
  return createElement(Icon, { 'aria-hidden': true, ...props });
}
