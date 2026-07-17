export interface ModuleLink {
  label: string;
  href: string;
  description: string;
  icon:
    | 'ShoppingCart'
    | 'Package'
    | 'Users'
    | 'BookOpen'
    | 'TrendingUp'
    | 'ChefHat'
    | 'Truck'
    | 'Building2';
  color: string;
}

export const MODULES: ModuleLink[] = [
  {
    label: 'Punto de Venta',
    href: '/modulos/pos',
    description: 'Ventas rápidas en piso y barra',
    icon: 'ShoppingCart',
    color: 'text-orange-500',
  },
  {
    label: 'Inventarios',
    href: '/modulos/inventarios',
    description: 'Control de stock en tiempo real',
    icon: 'Package',
    color: 'text-emerald-500',
  },
  {
    label: 'Nómina',
    href: '/modulos/nomina',
    description: 'Pagos y RRHH sin fricción',
    icon: 'Users',
    color: 'text-violet-500',
  },
  {
    label: 'Contabilidad',
    href: '/modulos/contabilidad',
    description: 'Libros contables automatizados',
    icon: 'BookOpen',
    color: 'text-blue-500',
  },
  {
    label: 'Finanzas',
    href: '/modulos/finanzas',
    description: 'Tesorería y flujo de caja claro',
    icon: 'TrendingUp',
    color: 'text-cyan-500',
  },
  {
    label: 'Producción',
    href: '/modulos/produccion',
    description: 'Control de cocina y merma',
    icon: 'ChefHat',
    color: 'text-amber-500',
  },
  {
    label: 'Proveedores',
    href: '/modulos/proveedores',
    description: 'Compras y órdenes centralizadas',
    icon: 'Truck',
    color: 'text-rose-500',
  },
  {
    label: 'Multi-sede',
    href: '/modulos/multi-sede',
    description: 'Una sola vista para toda la cadena',
    icon: 'Building2',
    color: 'text-indigo-500',
  },
];

export interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Módulos', href: '#', hasDropdown: true },
  { label: 'Precios', href: '/precios' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Blog', href: '/blog' },
];

export const COMPANY_LINKS: NavLink[] = [
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Precios', href: '/precios' },
];

export const LEGAL_LINKS: NavLink[] = [
  { label: 'Política de Privacidad', href: '/legal/privacidad' },
  { label: 'Términos y Condiciones', href: '/legal/terminos' },
  { label: 'Política de Cookies', href: '/legal/cookies' },
  { label: 'Eliminación de Datos', href: '/legal/eliminacion-datos' },
  { label: 'EULA', href: '/legal/eula' },
  { label: 'Política de Soporte', href: '/legal/soporte' },
  { label: 'Política de Reembolsos', href: '/legal/reembolsos' },
];
