# TASK 03 — Navbar y Footer

**Estado:** [ ] Pendiente
**Depende de:** 02-design-system

---

## 3.1 — Navbar (`src/components/layout/Navbar.tsx`)

### Comportamiento

- **Transparente** encima del hero (posición `fixed`)
- **Fondo blanco** con `backdrop-blur` y sombra al hacer scroll > 20px
- Transición suave al cambiar estado: `transition-all duration-300`
- Mobile: hamburger menu con panel deslizante (Framer Motion `AnimatePresence`)

### Estructura HTML

```
<header>
  <nav>
    <Logo />
    <DesktopMenu />     ← links + dropdown "Módulos"
    <NavActions />      ← "Solicitar Demo" + "Iniciar sesión"
    <MobileMenuButton />
  </nav>
  <MobileMenu />       ← panel overlay animado
</header>
```

### Links de navegación

```typescript
const NAV_LINKS = [
  { label: 'Módulos', href: '#', hasDropdown: true },
  { label: 'Precios', href: '/precios' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Blog', href: '/blog' },
];

const MODULES_DROPDOWN = [
  { label: 'Punto de Venta', href: '/modulos/pos', icon: 'ShoppingCart', color: 'text-orange-500' },
  {
    label: 'Inventarios',
    href: '/modulos/inventarios',
    icon: 'Package',
    color: 'text-emerald-500',
  },
  { label: 'Nómina', href: '/modulos/nomina', icon: 'Users', color: 'text-violet-500' },
  {
    label: 'Contabilidad',
    href: '/modulos/contabilidad',
    icon: 'BookOpen',
    color: 'text-blue-500',
  },
  { label: 'Finanzas', href: '/modulos/finanzas', icon: 'TrendingUp', color: 'text-cyan-500' },
  { label: 'Producción', href: '/modulos/produccion', icon: 'ChefHat', color: 'text-amber-500' },
  { label: 'Proveedores', href: '/modulos/proveedores', icon: 'Truck', color: 'text-rose-500' },
  { label: 'Multi-sede', href: '/modulos/multi-sede', icon: 'Building2', color: 'text-indigo-500' },
];
```

### Dropdown de módulos

- Aparece en hover con `AnimatePresence` (opacidad + translateY)
- Grid 2 columnas en desktop
- Íconos Lucide React coloreados por módulo
- Descripción corta de 6 palabras máx bajo cada link

### Logo

- SVG inline del logo OpsSync
- `text-white` en hero, `text-brand-900` en scroll

### Mobile menu

- Full-screen overlay con `bg-brand-950`
- Links en lista vertical con stagger animation
- CTA "Solicitar Demo" al fondo

---

## 3.2 — Footer (`src/components/layout/Footer.tsx`)

### Layout

4 columnas en desktop, 2 en tablet, 1 en mobile:

```
Col 1: Logo + descripción + redes sociales (LinkedIn, Twitter/X, Instagram)
Col 2: Producto
       - Módulos (link a cada uno)
Col 3: Empresa
       - Nosotros
       - Blog
       - Contacto
       - Precios
Col 4: Legal
       - Política de Privacidad
       - Términos y Condiciones
       - Política de Cookies
       - Eliminación de Datos
       - EULA
       - Política de Soporte
       - Política de Reembolsos
```

### Bottom bar

```
© 2025 OpsSync. Todos los derechos reservados.  |  Hecho con ❤️ en Colombia
```

### Estilos

- Fondo: `bg-brand-950` (oscuro)
- Texto: `text-neutral-400` — links: `hover:text-white transition-colors`
- Separador: `border-t border-white/10`

---

## Criterios de aceptación

- [ ] Navbar cambia fondo al hacer scroll
- [ ] Dropdown de módulos funciona en desktop
- [ ] Mobile menu abre/cierra con animación
- [ ] Footer renderiza todas las columnas
- [ ] Todos los links de navegación son correctos
- [ ] Responsive en 320px, 768px, 1024px, 1440px
