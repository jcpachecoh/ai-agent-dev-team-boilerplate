import React, { type JSX, type ReactNode, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, ChefHat, Package, ShieldCheck, ShoppingCart } from 'lucide-react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginSurfaceProps } from '../shared/web-login-types';
import styles from './WebLoginHeroPanel.module.scss';

export interface WebLoginHeroPanelProps extends WebLoginSurfaceProps {
  /** Uppercase module title (e.g. COMMAND CENTER) */
  brandName?: string;
  /** Uppercase context line (e.g. PLATFORM · RESTOPSIQ ENTERPRISE) */
  brandLocation?: string;
  brandInitial?: string;
  headline?: string;
  description?: string;
  statusLine?: string;
  logo?: ReactNode;
  /** Optional background image URL. A dark overlay is applied automatically. */
  heroImageUrl?: string;
}

const SPOTLIGHT_INTERVAL_MS = 3500;

const FEATURES = [
  {
    Icon: BarChart3,
    label: 'Ventas en tiempo real',
    detail: 'Analiza por sede, turno y producto con insights automáticos.',
  },
  {
    Icon: Package,
    label: 'Inventario inteligente',
    detail: 'Alertas de stock crítico antes de que afecten la operación.',
  },
  {
    Icon: ChefHat,
    label: 'Producción en cocina',
    detail: 'Desde la receta hasta el plato, trazabilidad completa.',
  },
  {
    Icon: ShoppingCart,
    label: 'Compras y proveedores',
    detail: 'Cotizaciones, aprobaciones y órdenes de compra unificadas.',
  },
  {
    Icon: ShieldCheck,
    label: 'Auditoría completa',
    detail: 'Historial de cada operación, quién hizo qué y cuándo.',
  },
] as const;

export function WebLoginHeroPanel({
  brandName = 'COMMAND CENTER',
  brandLocation = 'PLATFORM · RESTOPSIQ ENTERPRISE',
  brandInitial = 'R',
  headline = 'Centro de inteligencia operativa para tu restaurante',
  description = 'Controla ventas, inventario, compras y operaciones en tiempo real desde un solo lugar.',
  statusLine = 'Sistema conectado · 10 sedes activas · v2.0.0-demo',
  logo,
  heroImageUrl,
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginHeroPanelProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURES.length);
    }, SPOTLIGHT_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const { Icon: ActiveIcon, label, detail } = FEATURES[activeIndex];

  return (
    <section
      className={webLoginSurfaceClass(
        `${styles.panel}${heroImageUrl ? ` ${styles.hasImage}` : ''}`,
        styles,
        {
          theme,
          size,
          className,
        },
      )}
      style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})` } : undefined}
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

      <div className={styles.spotlight}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={styles.spotlightCard}
            aria-live="polite"
          >
            <div className={styles.spotlightIcon} aria-hidden>
              <ActiveIcon size={34} strokeWidth={1.5} />
            </div>
            <p className={styles.spotlightLabel}>{label}</p>
            <p className={styles.spotlightDetail}>{detail}</p>
          </motion.div>
        </AnimatePresence>

        <div className={styles.spotlightTrack} role="tablist" aria-label="Características">
          {FEATURES.map((f, i) => (
            <button
              key={f.label}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={f.label}
              className={`${styles.spotlightDot}${i === activeIndex ? ` ${styles.spotlightDotActive}` : ''}`}
              onClick={() => setActiveIndex(i)}
            >
              {i === activeIndex && (
                <motion.span
                  key={`fill-${activeIndex}`}
                  className={styles.spotlightDotFill}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: SPOTLIGHT_INTERVAL_MS / 1000, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
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
