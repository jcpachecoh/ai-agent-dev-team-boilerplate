# TASK 08 — SEO, Performance y QA Final

**Estado:** [ ] Pendiente
**Depende de:** 04, 05, 06, 07

---

## 8.1 — Metadata factory (`src/lib/metadata.ts`)

```typescript
import type { Metadata } from 'next';

const BASE_URL = 'https://opssynk.com';

export function createMetadata(options: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
}): Metadata {
  const { title, description, path, ogImage = '/og-default.png', noIndex = false } = options;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: `${BASE_URL}${path}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${path}`,
      type: 'website',
      locale: 'es_CO',
      siteName: 'OpsSync',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
  };
}
```

---

## 8.2 — Sitemap automático

`next-sitemap` genera `/sitemap.xml` en `postbuild`. Configurar prioridades:

```javascript
// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://opssynk.com',
  generateRobotsTxt: true,
  transform: async (config, path) => ({
    loc: path,
    changefreq: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1.0 : path.startsWith('/modulos') ? 0.9 : 0.7,
    lastmod: new Date().toISOString(),
  }),
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
    ],
    additionalSitemaps: ['https://opssynk.com/sitemap.xml'],
  },
};
```

---

## 8.3 — JSON-LD structured data

### Homepage — Organization schema

```typescript
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OpsSync',
  url: 'https://opssynk.com',
  logo: 'https://opssynk.com/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+57-310-000-0000',
    contactType: 'customer support',
    areaServed: ['CO', 'MX', 'PE', 'CL'],
    availableLanguage: 'Spanish',
  },
  sameAs: ['https://twitter.com/opssynk', 'https://linkedin.com/company/opssynk'],
};
```

### Módulos — SoftwareApplication schema

```typescript
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OpsSync POS',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Android, iOS, Web',
  offers: { '@type': 'Offer', price: '299000', priceCurrency: 'COP' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '52' },
};
```

---

## 8.4 — Open Graph images

Crear imágenes OG estáticas en `/public/`:

- `og-default.png` — 1200×630 general
- `og-pos.png` — módulo POS
- `og-inventarios.png` — módulo inventarios
- (una por módulo + homepage)

Alternativamente: usar `next/og` (ImageResponse) para OG dinámico:

```typescript
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }

export default async function Image() {
  return new ImageResponse(
    <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ color: 'white', fontSize: 72, fontWeight: 700 }}>OpsSync</h1>
    </div>
  )
}
```

---

## 8.5 — Performance checklist

### Imágenes

- [ ] Todas las imágenes con `next/image`
- [ ] `priority` prop en imagen del hero (LCP)
- [ ] `blur` placeholder en imágenes grandes
- [ ] Formatos AVIF/WebP habilitados en `next.config.js`

### JavaScript

- [ ] `'use client'` solo donde se necesita estado/eventos
- [ ] Framer Motion: import `{ motion }` not barrel imports
- [ ] `dynamic(() => import(...), { ssr: false })` para componentes pesados

### Fuentes

- [ ] Geist cargada con `display: swap` (ya incluido en `next/font`)
- [ ] Sin Google Fonts externas (todo self-hosted via `next/font`)

### Crítico

- [ ] No hay `useEffect` en server components
- [ ] Metadata en cada página (no solo root layout)
- [ ] `<head>` sin links de CSS externos

---

## 8.6 — QA checklist final

### Funcional

- [ ] Todos los links de la navbar funcionan
- [ ] Dropdown de módulos funciona en desktop y mobile
- [ ] Footer links navegan correctamente
- [ ] Formulario de contacto: envía + muestra success
- [ ] Formulario de eliminación de datos: envía + muestra success
- [ ] Toggle de precios cambia correctamente

### Visual

- [ ] Animaciones funcionan en Chrome, Safari, Firefox
- [ ] No hay saltos de layout (CLS = 0)
- [ ] Navbar cambia fondo al hacer scroll
- [ ] Modo oscuro del hero → transición a blanco en siguientes secciones
- [ ] Sin overflow horizontal en ninguna resolución

### Responsive (probar en):

- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 14)
- [ ] 768px (iPad)
- [ ] 1024px (iPad Pro)
- [ ] 1440px (Desktop)
- [ ] 1920px (Wide)

### SEO

- [ ] `<title>` único por página
- [ ] `<meta description>` única por página
- [ ] `<link rel="canonical">` en cada página
- [ ] OG tags presentes
- [ ] `/sitemap.xml` accesible y válido
- [ ] `/robots.txt` accesible
- [ ] JSON-LD válido (probar en schema.org validator)

### App Store readiness

- [ ] `/legal/privacidad` → accesible sin login ✓
- [ ] `/legal/eula` → accesible sin login ✓
- [ ] `/legal/soporte` → accesible sin login ✓
- [ ] `/legal/reembolsos` → accesible sin login ✓
- [ ] `/legal/eliminacion-datos` → accesible sin login + formulario funcional ✓

### Lighthouse targets (en mobile con throttling)

- [ ] Performance ≥ 90
- [ ] Accessibility ≥ 95
- [ ] Best Practices ≥ 95
- [ ] SEO = 100

---

## Criterios de aceptación

- [ ] Todos los checks de QA en verde
- [ ] Lighthouse ≥ 90 performance en desktop
- [ ] `/sitemap.xml` generado con todas las páginas
- [ ] No hay errores en consola en ninguna página
- [ ] `pnpm --filter web build` sin warnings de TypeScript
