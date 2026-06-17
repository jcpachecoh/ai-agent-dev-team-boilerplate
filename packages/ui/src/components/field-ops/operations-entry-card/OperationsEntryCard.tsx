import { ChefHat, ChevronRight, Factory, MonitorSmartphone } from 'lucide-react';
import type { CSSProperties, JSX, ReactNode } from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './OperationsEntryCard.module.scss';

type AccentPreset = 'mint' | 'purple' | 'gold' | 'warning' | 'danger' | 'info' | 'enterprise';

const ACCENT_PRESETS: Record<AccentPreset, string> = {
  mint: '#2ec4a0',
  purple: '#8b5cf6',
  gold: '#d4a017',
  warning: '#f0c040',
  danger: '#e85d4a',
  info: '#3b82f6',
  enterprise: '#e8943a',
};

function resolveAccentColor(accent: AccentPreset | string | undefined): string {
  if (!accent) return ACCENT_PRESETS.mint;
  return ACCENT_PRESETS[accent as AccentPreset] ?? accent;
}

function hexToRgbChannels(hex: string): string | null {
  const value = hex.trim().replace('#', '');
  const normalized =
    value.length === 3
      ? value
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : value;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r} ${g} ${b}`;
}

export interface OperationsEntryCardProps {
  category: string;
  title: string;
  description: string;
  icon?: ReactNode;
  iconName?: 'terminal' | 'recipes' | 'operations';
  tags?: string[];
  actionLabel?: string;
  onAction?: () => void;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  accent?: AccentPreset | string;
  className?: string;
}

export function OperationsEntryCard({
  category,
  title,
  description,
  icon,
  iconName = 'operations',
  tags = [],
  actionLabel = 'Ingresar',
  onAction,
  theme = 'dark',
  size = 'md',
  accent = 'mint',
  className,
}: OperationsEntryCardProps): JSX.Element {
  const accentColor = resolveAccentColor(accent);
  const rgbChannels = hexToRgbChannels(accentColor);

  const style = {
    '--entry-accent': accentColor,
    '--entry-accent-rgb': rgbChannels ?? '46 196 160',
  } as CSSProperties;

  const classes = [styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
    .filter(Boolean)
    .join(' ');

  const resolvedIcon =
    icon ??
    (iconName === 'terminal' ? (
      <MonitorSmartphone size={24} aria-hidden />
    ) : iconName === 'recipes' ? (
      <ChefHat size={24} aria-hidden />
    ) : (
      <Factory size={24} aria-hidden />
    ));

  return (
    <article className={classes} style={style}>
      <div className={styles.iconWrap}>{resolvedIcon}</div>

      <span className={styles.category}>{category}</span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>

      <footer className={styles.footer}>
        <span className={styles.tags}>{tags.join('   ')}</span>
        <button type="button" className={styles.action} onClick={onAction}>
          <span>{actionLabel}</span>
          <ChevronRight size={14} aria-hidden />
        </button>
      </footer>

      <div className={styles.glow} aria-hidden />
    </article>
  );
}

export default OperationsEntryCard;
