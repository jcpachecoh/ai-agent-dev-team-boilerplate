# TASK 01 — Configuración del Proyecto

**App:** `apps/web`
**Estado:** [ ] Pendiente

---

## Objetivo

Preparar `apps/web` como proyecto Next.js 16 completo con Tailwind CSS v4, Framer Motion, y todas las dependencias necesarias para la landing.

## Pasos

### 1.1 — Limpiar `package.json` y añadir dependencias

```bash
cd apps/web
pnpm add framer-motion lucide-react clsx tailwind-merge
pnpm add react-hook-form @hookform/resolvers zod
pnpm add @vercel/analytics
pnpm add -D tailwindcss @tailwindcss/typography postcss autoprefixer
pnpm add -D next-sitemap
```

**Remover dependencias innecesarias de packages internos** que no aplican al landing (tipos de ERP, api-client).

### 1.2 — Configurar Tailwind CSS v4

Crear `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#0a0f1e',
          900: '#0f172a',
          800: '#1e293b',
          700: '#1e3a5f',
          600: '#2563eb',
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd',
        },
        accent: {
          600: '#ea6d0a',
          500: '#f97316',
          400: '#fb923c',
          300: '#fdba74',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
```

### 1.3 — Configurar `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
};

export default nextConfig;
```

### 1.4 — Variables de entorno

Crear `apps/web/.env.example`:

```env
# Resend (formulario de contacto)
RESEND_API_KEY=re_...
CONTACT_EMAIL=contacto@opssynk.com

# OG Images
NEXT_PUBLIC_APP_URL=https://opssynk.com
```

### 1.5 — next-sitemap config

Crear `apps/web/next-sitemap.config.js`:

```javascript
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://opssynk.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }],
  },
  exclude: ['/api/*'],
};
```

Añadir en `package.json` scripts:

```json
"postbuild": "next-sitemap"
```

### 1.6 — Estructura de carpetas `src/`

```
src/
├── app/
│   ├── layout.tsx              ← root layout
│   ├── page.tsx                ← homepage
│   ├── modulos/
│   │   ├── pos/page.tsx
│   │   ├── inventarios/page.tsx
│   │   ├── nomina/page.tsx
│   │   ├── contabilidad/page.tsx
│   │   ├── finanzas/page.tsx
│   │   ├── produccion/page.tsx
│   │   ├── proveedores/page.tsx
│   │   └── multi-sede/page.tsx
│   ├── precios/page.tsx
│   ├── nosotros/page.tsx
│   ├── contacto/page.tsx
│   ├── blog/page.tsx
│   └── legal/
│       ├── privacidad/page.tsx
│       ├── terminos/page.tsx
│       ├── cookies/page.tsx
│       ├── eliminacion-datos/page.tsx
│       ├── eula/page.tsx
│       ├── soporte/page.tsx
│       └── reembolsos/page.tsx
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── AnimatedSection.tsx
│   ├── home/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── ModulesGrid.tsx
│   │   ├── SocialProof.tsx
│   │   ├── HowItWorks.tsx
│   │   └── CtaSection.tsx
│   └── modules/
│       └── ModulePageLayout.tsx
└── lib/
    ├── metadata.ts             ← factory de metadata por página
    └── cn.ts                   ← clsx + tailwind-merge helper
```

## Criterios de aceptación

- [ ] `pnpm --filter web dev` levanta sin errores
- [ ] Tailwind CSS genera estilos correctamente
- [ ] Framer Motion importa sin errores
- [ ] `pnpm --filter web build` completa sin errores de tipo
