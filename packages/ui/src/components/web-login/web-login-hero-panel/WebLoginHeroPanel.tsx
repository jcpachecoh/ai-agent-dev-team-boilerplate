import React, { type JSX, type ReactNode } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginStat, WebLoginSurfaceProps } from '../shared/web-login-types';
import { WebLoginStatCard } from '../web-login-stat-card';
import styles from './WebLoginHeroPanel.module.scss';

export interface WebLoginHeroPanelProps extends WebLoginSurfaceProps {
  /** Uppercase module title (e.g. COMMAND CENTER) */
  brandName?: string;
  /** Uppercase context line (e.g. PLATFORM · RESTOPSIQ ENTERPRISE) */
  brandLocation?: string;
  brandInitial?: string;
  headline?: string;
  description?: string;
  stats?: WebLoginStat[];
  statusLine?: string;
  logo?: ReactNode;
}

const DEFAULT_STATS: WebLoginStat[] = [
  { label: 'Ventas hoy', value: '$4.280.000', trendLabel: '↑ 12% vs ayer', trendTone: 'success' },
  { label: 'Órdenes activas', value: '23', trendLabel: '8 en cocina', trendTone: 'neutral' },
  { label: 'Food cost', value: '28.4%', trendLabel: 'Dentro de meta', trendTone: 'success' },
  { label: 'Alertas', value: '3', trendLabel: '2 inventario', trendTone: 'warning' },
];

export function WebLoginHeroPanel({
  brandName = 'COMMAND CENTER',
  brandLocation = 'PLATFORM · RESTOPSIQ ENTERPRISE',
  brandInitial = 'R',
  headline = 'Centro de inteligencia operativa para tu restaurante',
  description = 'Controla ventas, inventario, compras y operaciones en tiempo real desde un solo lugar.',
  stats = DEFAULT_STATS,
  statusLine = 'Sistema conectado · 10 sedes activas · v2.0.0-demo',
  logo,
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginHeroPanelProps): JSX.Element {
  return (
    <section
      className={webLoginSurfaceClass(styles.panel, styles, { theme, size, className })}
      aria-label="Presentación"
    >
      <header className={styles.brand}>
        <div className={styles.logo} aria-hidden={logo ? undefined : true}>
          {logo ?? <span className={styles.logoInitial}>{brandInitial}</span>}
        </div>
        <div className={styles.brandText}>
          <p className={styles.brandName}>{brandName}</p>
          <p className={styles.brandLocation}>{brandLocation}</p>
        </div>
      </header>

      <div className={styles.copy}>
        <h1 className={styles.headline}>{headline}</h1>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.statsGrid} role="list">
        {stats.map((stat) => (
          <div key={stat.label} role="listitem">
            <WebLoginStatCard
              label={stat.label}
              value={stat.value}
              trendLabel={stat.trendLabel}
              trendTone={stat.trendTone}
              theme={theme}
              size={size}
            />
          </div>
        ))}
      </div>

      {statusLine ? (
        <footer className={styles.status}>
          <span className={styles.statusDot} aria-hidden />
          <span>{statusLine}</span>
        </footer>
      ) : null}
    </section>
  );
}
