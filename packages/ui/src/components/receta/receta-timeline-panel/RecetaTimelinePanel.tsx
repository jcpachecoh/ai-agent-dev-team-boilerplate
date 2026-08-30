import React, { type JSX } from 'react';

import styles from './RecetaTimelinePanel.module.scss';
import type { RecetaTheme } from '../shared/receta-types';

export interface RecetaTimelineItem {
  label: string;
  duration: string;
}

export interface RecetaTimelinePanelProps {
  title?: string;
  items?: RecetaTimelineItem[];
  theme?: RecetaTheme;
  className?: string;
}

const defaultItems: RecetaTimelineItem[] = [
  { label: 'Preparación de ingredientes', duration: '15 min' },
  { label: 'Marinado', duration: '30 min' },
  { label: 'Cocción', duration: '45 min' },
];

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

export function RecetaTimelinePanel({
  title = 'Línea de Tiempo',
  items = defaultItems,
  theme = 'dark',
  className,
}: RecetaTimelinePanelProps): JSX.Element {
  return (
    <section className={[styles.panel, themeClasses[theme], className].filter(Boolean).join(' ')}>
      <h3 className={styles.title}>{title}</h3>
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={`${item.label}-${item.duration}`} className={styles.item}>
            <span className={styles.index}>{index + 1}</span>
            <span className={styles.content}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.duration}>{item.duration}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default RecetaTimelinePanel;
