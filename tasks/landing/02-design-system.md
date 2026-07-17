# TASK 02 — Design System y Componentes Base

**Estado:** [ ] Pendiente
**Depende de:** 01-project-setup

---

## Objetivo

Crear el sistema de diseño compartido: tokens de estilo, componentes UI reutilizables, y helpers de animación. Estética tipo Apple: limpio, espaciado, animaciones suaves con propósito.

---

## 2.1 — Root Layout (`src/app/layout.tsx`)

```tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://opssynk.com'),
  title: {
    default: 'OpsSync — ERP para Restaurantes en LATAM',
    template: '%s | OpsSync',
  },
  description:
    'Plataforma ERP multi-sede para restaurantes: POS, inventarios, nómina, contabilidad y control de producción en una sola app.',
  keywords: [
    'ERP restaurantes',
    'software restaurante Colombia',
    'POS restaurante',
    'control inventarios restaurante',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://opssynk.com',
    siteName: 'OpsSync',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@opssynk',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased bg-white text-neutral-900">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 2.2 — `globals.css`

```css
@import 'tailwindcss';

:root {
  --font-geist-sans: 'Geist Sans', system-ui, sans-serif;
  --font-geist-mono: 'Geist Mono', monospace;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

/* Scroll-driven animation utility */
@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(32px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-on-scroll {
  animation: reveal-up linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}
```

---

## 2.3 — `cn.ts` helper

```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 2.4 — `Button.tsx`

Variantes: `primary` | `secondary` | `outline` | `ghost`
Tamaños: `sm` | `md` | `lg`

Efectos:

- Hover: `scale-[1.02]` + sombra
- Active: `scale-[0.98]`
- Transición: `transition-all duration-200 ease-out`

Primary: `bg-brand-600 hover:bg-brand-700 text-white` + sombra `shadow-brand` personalizada
Outline: `border-2 border-brand-600 text-brand-600 hover:bg-brand-50`

---

## 2.5 — `AnimatedSection.tsx`

Wrapper con Framer Motion para animaciones scroll-triggered:

```tsx
'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface Props {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  className?: string;
}

export function AnimatedSection({ children, delay = 0, direction = 'up', className }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 32 : 0,
      x: direction === 'left' ? -32 : direction === 'right' ? 32 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

---

## 2.6 — `Badge.tsx`

Para etiquetas de módulos. Variantes de color por módulo:

- POS: naranja (`accent`)
- Inventarios: verde (`emerald`)
- Nómina: violeta (`violet`)
- Contabilidad: azul (`brand`)
- Finanzas: cyan (`cyan`)
- Producción: amarillo (`amber`)
- Proveedores: rosa (`rose`)
- Multi-sede: índigo (`indigo`)

---

## 2.7 — `Card.tsx`

Variante glassmorphism para hero/dark:

```
bg-white/5 backdrop-blur-md border border-white/10
```

Variante clara para secciones blancas:

```
bg-white border border-neutral-200 shadow-sm hover:shadow-md
```

Hover effect: `hover:-translate-y-1 transition-transform duration-300`

---

## Criterios de aceptación

- [ ] Layout renderiza Navbar + children + Footer
- [ ] `AnimatedSection` anima correctamente al hacer scroll
- [ ] Button tiene los 4 variantes funcionales
- [ ] Paleta de colores aplicada via Tailwind config
- [ ] Fuente Geist cargada correctamente (sin layout shift)
