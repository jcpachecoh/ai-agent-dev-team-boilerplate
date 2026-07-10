import type { SidebarAccent } from '@restopsiq/ui';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BarChart3,
  Box,
  Briefcase,
  Building2,
  ChefHat,
  ClipboardList,
  Clock,
  Factory,
  FileText,
  History,
  Info,
  Key,
  Landmark,
  LayoutGrid,
  List,
  Map,
  MapPin,
  Monitor,
  Package,
  Scale,
  Palmtree,
  Settings,
  Shield,
  ShieldCheck,
  Stethoscope,
  Truck,
  Tags,
  TriangleAlert,
  Users,
  User,
  UserRound,
  Wallet,
  Warehouse,
} from 'lucide-react';

export interface NavChildItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** When true, only an exact path match marks this child active. */
  end?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: LucideIcon;
  badge?: number;
  /** Sidebar highlight color when this module is active. */
  accent?: SidebarAccent;
  children?: NavChildItem[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutGrid,
    accent: 'teal',
  },
  {
    id: 'proveedores',
    label: 'Gestión de Proveedores',
    path: '/proveedores',
    icon: Package,
    accent: 'gold',
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Warehouse,
    badge: 5,
    accent: 'green',
    children: [
      { id: 'inv-dashboard', label: 'Dashboard', path: '/inventory', icon: LayoutGrid },
      { id: 'inv-products', label: 'Productos', path: '/inventory/products', icon: Box },
      {
        id: 'inv-categories',
        label: 'Categorías',
        path: '/inventory/categories',
        icon: Tags,
      },
      {
        id: 'inv-movements',
        label: 'Movimientos',
        path: '/inventory/movements',
        icon: ArrowLeftRight,
      },
      { id: 'inv-alerts', label: 'Alertas', path: '/inventory/alerts', icon: TriangleAlert },
      { id: 'inv-reports', label: 'Reportes', path: '/inventory/reports', icon: FileText },
    ],
  },
  {
    id: 'recetas',
    label: 'Recetas',
    icon: ChefHat,
    accent: 'purple',
    children: [
      { id: 'rec-list', label: 'Lista de Recetas', path: '/recetas', icon: List },
      {
        id: 'rec-categories',
        label: 'Categorías',
        path: '/recetas/categorias',
        icon: Tags,
      },
      {
        id: 'rec-history',
        label: 'Historial de Ejecuciones',
        path: '/recetas/historial',
        icon: History,
      },
    ],
  },
  {
    id: 'produccion',
    label: 'Producción',
    icon: Factory,
    accent: 'orange',
    children: [
      {
        id: 'prod-orders',
        label: 'Órdenes de producción',
        path: '/produccion/ordenes',
        icon: ClipboardList,
      },
      {
        id: 'prod-committees',
        label: 'Comités de producción',
        path: '/produccion/comites',
        icon: Users,
      },
    ],
  },
  {
    id: 'supervisor',
    label: 'Supervisor',
    icon: Monitor,
    accent: 'teal',
    children: [
      {
        id: 'supervisor-map',
        label: 'Mapa de planta',
        path: '/supervisor/mapa',
        icon: Map,
      },
      {
        id: 'supervisor-stations',
        label: 'Estaciones',
        path: '/supervisor/estaciones',
        icon: LayoutGrid,
      },
      {
        id: 'supervisor-process',
        label: 'Control de Procesos',
        path: '/recetas/procesos',
        icon: Monitor,
      },
    ],
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: Users,
    accent: 'teal',
    children: [
      { id: 'users-list', label: 'Usuarios', path: '/users', icon: Users },
      { id: 'users-roles', label: 'Roles', path: '/users/roles', icon: Shield },
      { id: 'users-perms', label: 'Permisos', path: '/users/permissions', icon: Key },
    ],
  },
  {
    id: 'asistencia',
    label: 'Asistencia',
    icon: ClipboardList,
    accent: 'teal',
    children: [
      {
        id: 'attendance-panel',
        label: 'Panel de control',
        path: '/asistencia',
        icon: LayoutGrid,
        end: true,
      },
      {
        id: 'attendance-collaborators',
        label: 'Colaboradores',
        path: '/asistencia/colaboradores',
        icon: Users,
      },
      {
        id: 'attendance-shifts',
        label: 'Turnos',
        path: '/asistencia/turnos',
        icon: Clock,
      },
      {
        id: 'attendance-monitor',
        label: 'Asistencias',
        path: '/asistencia/asistencias',
        icon: Monitor,
        end: false,
      },
    ],
  },
  {
    id: 'nomina',
    label: 'Nómina',
    icon: Wallet,
    accent: 'amber',
    children: [
      { id: 'payroll', label: 'Reportes', path: '/payroll', icon: Wallet },
      { id: 'payroll-employees', label: 'Empleados', path: '/payroll/employees', icon: Users },
      {
        id: 'payroll-positions',
        label: 'Gestión de Cargos',
        path: '/payroll/positions',
        icon: Briefcase,
      },
      { id: 'payroll-salaries', label: 'Salarios', path: '/payroll/salaries', icon: BarChart3 },
      {
        id: 'payroll-legal-parameters',
        label: 'Parámetros legales',
        path: '/payroll/legal-parameters',
        icon: Scale,
      },
      {
        id: 'payroll-novedades',
        label: 'Novedades',
        path: '/payroll/novedades',
        icon: ClipboardList,
      },
      {
        id: 'payroll-novedades-incapacidades',
        label: 'Incapacidades',
        path: '/payroll/novedades/incapacidades',
        icon: Stethoscope,
      },
      {
        id: 'payroll-vacations',
        label: 'Vacaciones',
        path: '/payroll/vacations',
        icon: Palmtree,
      },
    ],
  },
  {
    id: 'mi-perfil',
    label: 'Mi perfil',
    icon: User,
    accent: 'teal',
    children: [
      {
        id: 'mi-perfil-personal',
        label: 'Información personal',
        path: '/mi-perfil/informacion-personal',
        icon: UserRound,
      },
      {
        id: 'mi-perfil-vacaciones',
        label: 'Vacaciones',
        path: '/mi-perfil/vacaciones',
        icon: Palmtree,
      },
      {
        id: 'mi-perfil-novedades',
        label: 'Novedades',
        path: '/mi-perfil/novedades',
        icon: ClipboardList,
      },
      {
        id: 'mi-perfil-seguridad-social',
        label: 'Seguridad social',
        path: '/mi-perfil/seguridad-social',
        icon: ShieldCheck,
      },
      {
        id: 'mi-perfil-bancos',
        label: 'Bancos',
        path: '/mi-perfil/bancos',
        icon: Landmark,
      },
      {
        id: 'mi-perfil-documentos',
        label: 'Documentos',
        path: '/mi-perfil/documentos',
        icon: FileText,
      },
    ],
  },
  {
    id: 'empresa',
    label: 'Empresa',
    icon: Building2,
    accent: 'teal',
    children: [
      {
        id: 'empresa-informacion',
        label: 'Información',
        path: '/empresa/informacion',
        icon: Info,
      },
      { id: 'empresa-sedes', label: 'Sedes', path: '/empresa/sedes', icon: MapPin },
    ],
  },
];

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/proveedores': 'Gestión de Proveedores',
  '/inventory': 'Inventario',
  '/inventory/products': 'Productos',
  '/inventory/categories': 'Categorías',
  '/inventory/movements': 'Movimientos',
  '/inventory/alerts': 'Alertas',
  '/inventory/reports': 'Reportes',
  '/recetas': 'Lista de Recetas',
  '/recetas/categorias': 'Categorías de Recetas',
  '/recetas/procesos': 'Control de Procesos',
  '/recetas/historial': 'Historial de Ejecuciones',
  '/produccion/ordenes': 'Órdenes de producción',
  '/produccion/ordenes/nueva': 'Nueva OP',
  '/produccion/comites': 'Comités de producción',
  '/produccion/comites/nuevo': 'Nuevo comité',
  '/supervisor/mapa': 'Mapa de planta',
  '/supervisor/estaciones': 'Estaciones de producción',
  '/reports': 'Panel de Supervisión',
  '/dispatch': 'Centro de Despacho',
  '/users': 'Usuarios',
  '/users/roles': 'Roles',
  '/users/permissions': 'Permisos',
  '/payroll': 'Reportes de nómina',
  '/payroll/reports': 'Reportes de nómina',
  '/payroll/employees': 'Empleados',
  '/payroll/positions': 'Gestión de Cargos',
  '/payroll/salaries': 'Salarios',
  '/payroll/dotaciones': 'Dotación',
  '/payroll/legal-parameters': 'Parámetros legales',
  '/payroll/novedades': 'Novedades',
  '/payroll/novedades/incapacidades': 'Incapacidades médicas',
  '/payroll/vacations': 'Vacaciones',
  '/mi-perfil': 'Mi perfil',
  '/mi-perfil/informacion-personal': 'Información personal',
  '/mi-perfil/vacaciones': 'Vacaciones',
  '/mi-perfil/novedades': 'Novedades',
  '/mi-perfil/seguridad-social': 'Seguridad social',
  '/mi-perfil/bancos': 'Bancos',
  '/mi-perfil/documentos': 'Documentos',
  '/asistencia': 'Panel de control',
  '/asistencia/colaboradores': 'Colaboradores',
  '/asistencia/turnos': 'Turnos',
  '/asistencia/asistencias': 'Asistencias',
  '/asistencia/reportes': 'Reportes',
  '/empresa/informacion': 'Información del restaurante',
  '/empresa/sedes': 'Sedes',
  '/empresa/sedes/nueva': 'Nueva sede',
  '/settings': 'Configuración',
};

function findParentNavItem(pathname: string): NavItem | undefined {
  return navigationItems.find((item) => {
    if (item.path === pathname) return true;
    return item.children?.some((child) => child.path === pathname);
  });
}

export function getBreadcrumbsForPath(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: 'Plant MES', path: '/' }];

  if (pathname === '/') {
    crumbs.push({ label: 'Dashboard' });
    return crumbs;
  }

  const parent = findParentNavItem(pathname);
  if (parent) {
    if (parent.children) {
      crumbs.push({ label: parent.label });
    }
    const label = routeLabels[pathname] ?? pathname;
    crumbs.push({ label });
    return crumbs;
  }

  crumbs.push({ label: routeLabels[pathname] ?? pathname });
  return crumbs;
}

export function isNavPathActive(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Exact match for siblings unless `end` is false — then nested routes also match. */
export function isNavChildPathActive(pathname: string, path: string, end = true): boolean {
  if (end) {
    return pathname === path;
  }
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.path && isNavPathActive(pathname, item.path)) return true;
  return (
    item.children?.some((child) => isNavChildPathActive(pathname, child.path, child.end ?? true)) ??
    false
  );
}
