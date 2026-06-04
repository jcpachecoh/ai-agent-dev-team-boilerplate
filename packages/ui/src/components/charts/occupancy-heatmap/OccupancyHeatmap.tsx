import * as React from 'react';

import { ChartContainer } from '../shared/ChartContainer';
import { CHART_COLOR_TOKENS } from '../shared/chart-colors';
import type { ChartBaseProps } from '../shared/types';
import styles from './OccupancyHeatmap.module.scss';

export interface HeatmapCell {
  day: string;
  hour: number;
  value: number;
}

export interface OccupancyHeatmapProps extends ChartBaseProps {
  data: HeatmapCell[];
  hourRange?: { start: number; end: number };
  dayLabels?: string[];
}

const DEFAULT_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function intensityColor(ratio: number): string {
  if (ratio <= 0) return 'rgba(173, 181, 189, 0.2)';
  if (ratio < 0.33) return 'rgba(23, 162, 184, 0.35)';
  if (ratio < 0.66) return 'rgba(212, 160, 23, 0.55)';
  return CHART_COLOR_TOKENS.warning;
}

export const OccupancyHeatmap: React.FC<OccupancyHeatmapProps> = ({
  data,
  hourRange = { start: 6, end: 12 },
  dayLabels = DEFAULT_DAYS,
  theme = 'light',
  size = 'md',
  loading = false,
  empty,
  emptyTitle,
  emptyDescription,
  ariaLabel = 'Occupancy heatmap',
  className,
}) => {
  const [hovered, setHovered] = React.useState<HeatmapCell | null>(null);
  const isEmpty = empty ?? data.length === 0;

  const hours = Array.from(
    { length: hourRange.end - hourRange.start + 1 },
    (_, i) => hourRange.start + i,
  );

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getValue = (day: string, hour: number): number =>
    data.find((c) => c.day === day && c.hour === hour)?.value ?? 0;

  const formatHour = (h: number): string => {
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour12}${suffix}`;
  };

  return (
    <ChartContainer
      theme={theme}
      size={size}
      loading={loading}
      empty={isEmpty}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      ariaLabel={ariaLabel}
      className={[styles.wrapper, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <div
        className={styles.grid}
        role="grid"
        style={{ gridTemplateColumns: `auto repeat(${hours.length}, 1fr)` }}
      >
        <div className={styles.corner} />
        {hours.map((hour) => (
          <div key={hour} className={styles.hourLabel} role="columnheader">
            {formatHour(hour)}
          </div>
        ))}
        {dayLabels.map((day) => (
          <React.Fragment key={day}>
            <div className={styles.dayLabel} role="rowheader">
              {day}
            </div>
            {hours.map((hour) => {
              const value = getValue(day, hour);
              const ratio = value / maxValue;
              return (
                <button
                  key={`${day}-${hour}`}
                  type="button"
                  className={styles.cell}
                  style={{ backgroundColor: intensityColor(ratio) }}
                  onMouseEnter={() => setHovered({ day, hour, value })}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered({ day, hour, value })}
                  onBlur={() => setHovered(null)}
                  aria-label={`${day} ${formatHour(hour)}: ${value}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {hovered ? (
        <div className={styles.tooltip} role="status">
          {hovered.day} · {formatHour(hovered.hour)}: <strong>{hovered.value}</strong>
        </div>
      ) : null}
    </ChartContainer>
  );
};

export default OccupancyHeatmap;
