# TASK 04 — Homepage

**Ruta:** `/`
**Estado:** [ ] Pendiente
**Depende de:** 02, 03

---

## Secciones (orden vertical)

### S1 — Hero (`components/home/Hero.tsx`)

**Visual:** Fondo oscuro `bg-brand-950` con gradiente radial azul/naranja en el centro (tipo Apple keynote). Partículas sutiles CSS.

**Estructura:**

```
[Badge] "Nuevo: Control de producción con IA"   ← animated chip
[H1] "El ERP que entiende      ← gran texto blanco, dos líneas
      tu restaurante"
[H2 sub] "Gestiona POS, inventario, nómina, contabilidad y producción
          desde una sola plataforma. Hecho para restaurantes en LATAM."
[CTA row] [Solicitar Demo →]  [Ver cómo funciona ▶]
[Social proof] "Confiado por +50 restaurantes en Colombia"
[Hero image] Mockup del dashboard flotando con sombra y blur backdrop
```

**Animaciones:**

- Badge: `animate-fade-in` con delay 0ms
- H1: palabras aparecen una por una (stagger 100ms)
- Subtítulo: `animate-fade-up` delay 400ms
- CTAs: `animate-fade-up` delay 600ms
- Imagen: `animate-fade-up` delay 800ms + `hover:scale-[1.02]`
- Gradiente de fondo: animación CSS `@keyframes` pulsante sutil (3s infinite)

**Gradiente background:**

```css
background:
  radial-gradient(ellipse at 50% 0%, rgba(37, 99, 235, 0.3) 0%, transparent 60%),
  radial-gradient(ellipse at 80% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 50%), #0a0f1e;
```

---

### S2 — Logos de clientes / Social Proof

**Visual:** Banda horizontal blanca con logos en escala de grises (opacity 40%, hover: 100%)

```
"Confiados por restaurantes líderes en Colombia"
[Logo1] [Logo2] [Logo3] [Logo4] [Logo5] [Logo6]
```

Animación: scroll horizontal infinito (marquee CSS) en mobile

---

### S3 — Features principales (`components/home/Features.tsx`)

**Visual:** Fondo blanco. Grid de 3 columnas con íconos grandes.

```
[Título] "Todo lo que necesita tu restaurante"
[Subtítulo] "Una plataforma integrada, sin silos de datos."

[Feature Card x6]
- Ícon grande (64px) con fondo de color suave
- Título (3 palabras máx)
- Descripción (2 líneas)

Features:
1. ⚡ Operación en tiempo real — datos sincronizados entre todas tus sedes
2. 🔒 Multi-sede seguro — cada sede aislada, un panel unificado
3. 📊 Reportes inteligentes — dashboards accionables, no tablas
4. 🤝 Proveedores integrados — pedidos, facturas y pagos en un lugar
5. 👨‍🍳 Control de recetas — costeo automático y control de mermas
6. 📱 Nativo en móvil — kiosko de turnos y POS desde cualquier dispositivo
```

Animación: stagger reveal al entrar al viewport (cada card con 100ms de delay)

---

### S4 — Módulos grid (`components/home/ModulesGrid.tsx`)

**Visual:** Fondo `bg-neutral-50`. Cards con ícon grande, título y descripción corta. Link "Ver más →" a página del módulo.

Layout: 4 cols desktop, 2 tablet, 1 mobile. Cards con hover lift.

**Contenido:**

| Módulo                | Ícono        | Color   | Descripción                                         |
| --------------------- | ------------ | ------- | --------------------------------------------------- |
| Punto de Venta        | ShoppingCart | orange  | Cobros rápidos, mesa, domicilio y para llevar       |
| Inventarios           | Package      | emerald | Control de stock en tiempo real por sede            |
| Nómina                | Users        | violet  | Liquidación automática según legislación colombiana |
| Contabilidad          | BookOpen     | blue    | Libro mayor, cuentas y conciliación automática      |
| Finanzas              | TrendingUp   | cyan    | Flujo de caja, presupuestos y tesorería             |
| Control de Producción | ChefHat      | amber   | Recetas, mermas, rendimientos y MES                 |
| Proveedores           | Truck        | rose    | Órdenes de compra, facturas y evaluación            |
| Multi-sede            | Building2    | indigo  | Un tenant, múltiples sedes con acceso granular      |

---

### S5 — Cómo funciona (`components/home/HowItWorks.tsx`)

**Visual:** Fondo oscuro `bg-brand-900`. 3 pasos en horizontal con línea conectora animada.

```
Paso 1: Configura tu restaurante (5 min)
        → Registra sedes, usuarios y menú inicial

Paso 2: Conecta tus operaciones
        → POS, cocina, bodega y RRHH sincronizados

Paso 3: Crece con datos
        → Reportes, alertas y decisiones en tiempo real
```

Animación: línea conectora se "dibuja" con SVG `stroke-dasharray` al scroll

---

### S6 — Testimonios

**Visual:** Fondo blanco. Slider horizontal con 3 testimonios visibles en desktop.

Cards:

- Avatar (imagen redonda)
- Cita entre comillas grandes
- Nombre + cargo + restaurante
- Rating 5 estrellas (lucide `Star` filled)

Framer Motion: drag-to-scroll en mobile

---

### S7 — CTA Final (`components/home/CtaSection.tsx`)

**Visual:** Gradiente `from-brand-600 to-brand-800`. Texto blanco centrado.

```
[H2] "¿Listo para transformar tu operación?"
[P]  "Agenda una demo gratuita de 30 minutos con nuestro equipo."
[CTA] [Solicitar Demo Gratis →]  [Hablar con ventas]
```

Animación: fondo con `backdrop` shine effect en hover sobre el CTA

---

## Metadata de la página

```typescript
export const metadata = {
  title: 'OpsSync — ERP para Restaurantes en LATAM',
  description:
    'Gestiona POS, inventario, nómina y contabilidad desde una sola plataforma. Hecho para restaurantes en Colombia y LATAM.',
  openGraph: { images: ['/og-home.png'] },
};
```

---

## Criterios de aceptación

- [ ] Hero renderiza con animaciones escalonadas
- [ ] Todas las secciones (S1–S7) presentes
- [ ] Animaciones scroll-triggered funcionan
- [ ] Links a páginas de módulos funcionan
- [ ] CTAs "Solicitar Demo" → `/contacto`
- [ ] Responsive en mobile (320px) sin overflow horizontal
- [ ] Lighthouse performance ≥ 90 en desktop
