import type { CSSProperties } from 'react';

/** Per-module sidebar highlight (parent + active child). */
export type SidebarAccent =
  | 'green'
  | 'purple'
  | 'gold'
  | 'blue'
  | 'orange'
  | 'teal'
  | 'amber'
  | 'muted';

const ACCENT_MAP: Record<SidebarAccent, { accent: string; subtle: string }> = {
  green: { accent: '#22c55e', subtle: 'rgba(34, 197, 94, 0.12)' },
  purple: { accent: '#8b5cf6', subtle: 'rgba(139, 92, 246, 0.12)' },
  gold: { accent: '#c8a96e', subtle: 'rgba(200, 169, 110, 0.12)' },
  blue: { accent: '#3b82f6', subtle: 'rgba(59, 130, 246, 0.12)' },
  orange: { accent: '#e8943a', subtle: 'rgba(232, 148, 58, 0.12)' },
  teal: { accent: '#2ec4a0', subtle: 'rgba(46, 196, 160, 0.12)' },
  amber: { accent: '#f0c040', subtle: 'rgba(240, 192, 64, 0.12)' },
  muted: { accent: '#888888', subtle: 'rgba(255, 255, 255, 0.06)' },
};

export function getSidebarAccentStyle(accent?: SidebarAccent): CSSProperties | undefined {
  if (!accent) return undefined;
  const colors = ACCENT_MAP[accent];
  return {
    ['--sidebar-accent' as string]: colors.accent,
    ['--sidebar-accent-subtle' as string]: colors.subtle,
  };
}
