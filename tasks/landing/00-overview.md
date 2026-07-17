# OpsSync Landing Page — Plan Maestro

**App:** `apps/web` (Next.js 16, App Router)
**Dominio:** opssynk.com
**Objetivo:** Landing pública para captación de clientes B2B en LATAM — restaurantes con operaciones multi-sede.
**Calidad visual:** Apple-level (scroll-driven animations, micro-interactions, tipografía precisa, espacio en blanco generoso)

---

## Stack técnico

| Elemento    | Librería                                         |
| ----------- | ------------------------------------------------ |
| Framework   | Next.js 16 (App Router)                          |
| Estilos     | Tailwind CSS v4                                  |
| Animaciones | Framer Motion + CSS scroll-driven                |
| Íconos      | Lucide React                                     |
| Formularios | react-hook-form + zod                            |
| Analytics   | Vercel Analytics                                 |
| Emails      | Resend (formulario de contacto)                  |
| Fuente      | Geist (variable) — igual que Apple San Francisco |
| Imágenes    | next/image con blur placeholder                  |
| SEO         | next-sitemap + metadata API                      |

---

## Paleta de colores

```
--brand-950: #0a0f1e   (fondo oscuro hero)
--brand-900: #0f172a   (secciones oscuras)
--brand-800: #1e293b   (cards oscuras)
--brand-600: #2563eb   (azul primario — confianza/tech)
--brand-500: #3b82f6   (azul medio)
--brand-400: #60a5fa   (azul claro — highlights)
--accent-500: #f97316  (naranja acento — restaurantes/calor)
--accent-400: #fb923c  (naranja suave)
--neutral-50:  #f8fafc (fondos claros)
--neutral-100: #f1f5f9 (cards claras)
--neutral-600: #475569 (texto secundario)
--neutral-900: #0f172a (texto principal)
```

**Modo:** Light-first con hero oscuro (degradado oscuro → claro)

---

## Sitemap completo

```
/                          → Homepage
/modulos/pos               → Punto de Venta
/modulos/inventarios       → Gestión de Inventarios
/modulos/nomina            → Nómina y RRHH
/modulos/contabilidad      → Contabilidad
/modulos/finanzas          → Finanzas y Tesorería
/modulos/produccion        → Control de Producción (MES)
/modulos/proveedores       → Proveedores y Compras
/modulos/multi-sede        → Multi-sede y Multi-tenant
/precios                   → Planes y Precios
/nosotros                  → Sobre OpsSync
/contacto                  → Contacto / Demo
/blog                      → Blog (stub para SEO)
/legal/privacidad          → Política de Privacidad (Google Play / Apple)
/legal/terminos            → Términos y Condiciones
/legal/cookies             → Política de Cookies
/legal/eliminacion-datos   → Eliminación de Datos (requerido por Meta/Facebook)
/legal/eula                → EULA — Licencia de Uso (App Stores)
/legal/soporte             → Política de Soporte (Apple Store)
/legal/reembolsos          → Política de Reembolsos (App Stores)
/sitemap.xml               → Auto-generado por next-sitemap
/robots.txt                → Auto-generado
```

---

## Tareas (orden de implementación)

| #   | Archivo                                              | Prioridad            |
| --- | ---------------------------------------------------- | -------------------- |
| 01  | Configuración del proyecto                           | CRÍTICO              |
| 02  | Design system (tokens, tipografía, componentes base) | CRÍTICO              |
| 03  | Layout raíz (Navbar + Footer)                        | CRÍTICO              |
| 04  | Homepage                                             | CRÍTICO              |
| 05  | Páginas de módulos (8 módulos)                       | ALTO                 |
| 06  | Página de precios                                    | ALTO                 |
| 07  | Página nosotros + contacto                           | MEDIO                |
| 08  | Páginas legales (7 páginas)                          | CRÍTICO — App Stores |
| 09  | SEO (metadata, sitemap, OG tags)                     | ALTO                 |
| 10  | Performance y QA final                               | ALTO                 |

---

## Criterios de calidad

- [ ] Lighthouse performance ≥ 90 en mobile
- [ ] LCP < 2.5s
- [ ] Cumplimiento Google Play Developer Policy (privacidad, EULA, soporte)
- [ ] Cumplimiento Apple App Store Review Guidelines (privacidad, EULA, soporte, reembolsos)
- [ ] Formulario de contacto funcional (demo request)
- [ ] SEO: metadata + OG + Twitter cards en todas las páginas
- [ ] Responsive: mobile-first, breakpoints sm/md/lg/xl/2xl
