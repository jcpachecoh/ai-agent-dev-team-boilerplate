import { format, isValid, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

import styles from './Timeline.module.scss';

export type TimelineItemColor = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';

export interface TimelineItem {
  timestamp: string | Date;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  color?: TimelineItemColor;
}

export interface TimelineProps {
  items: TimelineItem[];
  collapsible?: boolean;
  collapsedCount?: number;
  defaultExpanded?: boolean;
  order?: 'asc' | 'desc';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
  className?: string;
}

function toTime(value: string | Date): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  const parsed = parseISO(value);
  if (isValid(parsed)) {
    return parsed.getTime();
  }
  const fallback = new Date(value);
  return isValid(fallback) ? fallback.getTime() : 0;
}

function formatTimestamp(value: string | Date): string {
  const date = value instanceof Date ? value : parseISO(value);
  if (!isValid(date)) {
    return String(value);
  }
  return format(date, 'dd/MM/yyyy HH:mm');
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  collapsible = false,
  collapsedCount = 3,
  defaultExpanded = false,
  order = 'desc',
  theme = 'dark',
  size = 'md',
  className,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const diff = toTime(a.timestamp) - toTime(b.timestamp);
      return order === 'asc' ? diff : -diff;
    });
  }, [items, order]);

  const hiddenCount = Math.max(0, sortedItems.length - collapsedCount);
  const canCollapse = collapsible && hiddenCount > 0;
  const visibleItems =
    canCollapse && !expanded ? sortedItems.slice(0, collapsedCount) : sortedItems;

  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  return (
    <div className={[styles.timeline, sizeClass, themeClass, className].filter(Boolean).join(' ')}>
      <ol className={styles.list}>
        {visibleItems.map((item, index) => (
          <li key={`${item.title}-${index}`} className={styles.item}>
            <div className={styles.markerColumn}>
              <div
                className={[
                  styles.marker,
                  item.color && item.color !== 'default' ? styles[item.color] : styles.default,
                ].join(' ')}
              >
                {item.icon ?? <span className={styles.dot} />}
              </div>
              {index < visibleItems.length - 1 && <span className={styles.connector} aria-hidden />}
            </div>
            <div className={styles.content}>
              <time className={styles.timestamp} dateTime={String(item.timestamp)}>
                {formatTimestamp(item.timestamp)}
              </time>
              <p className={styles.title}>{item.title}</p>
              {item.description ? (
                <div className={styles.description}>{item.description}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {canCollapse ? (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp size={16} aria-hidden />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={16} aria-hidden />
              Show {hiddenCount} more events
            </>
          )}
        </button>
      ) : null}
    </div>
  );
};

export default Timeline;
