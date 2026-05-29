import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BarChart3,
  Box,
  ChefHat,
  FileText,
  History,
  Key,
  LayoutGrid,
  List,
  Monitor,
  Package,
  Settings,
  Shield,
  Truck,
  TriangleAlert,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react';

export interface NavChildItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: LucideIcon;
  badge?: number;
  children?: NavChildItem[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export const MOCK_USER = {
  name: 'Carlos Mendez',
  role: 'Supervisor',
};

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
    id: 'proveedores',
    label: 'Gestión de Proveedores',
    path: '/proveedores',
    icon: Package,
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Warehouse,
    badge: 5,
    children: [
      { id: 'inv-dashboard', label: 'Dashboard', path: '/inventory', icon: LayoutGrid },
      { id: 'inv-products', label: 'Productos', path: '/inventory/products', icon: Box },
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
    children: [
      { id: 'rec-list', label: 'Lista de Recetas', path: '/recetas', icon: List },
      {
        id: 'rec-process',
        label: 'Control de Procesos',
        path: '/recetas/procesos',
        icon: Monitor,
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
    id: 'supervision',
    label: 'Panel de Supervisión',
    path: '/reports',
    icon: Monitor,
    badge: 4,
  },
  {
    id: 'despacho',
    label: 'Centro de Despacho',
    path: '/dispatch',
    icon: Truck,
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: Users,
    children: [
      { id: 'users-list', label: 'Usuarios', path: '/users', icon: Users },
      { id: 'users-roles', label: 'Roles', path: '/users/roles', icon: Shield },
      { id: 'users-perms', label: 'Permisos', path: '/users/permissions', icon: Key },
    ],
  },
  {
    id: 'nomina',
    label: 'Nómina',
    icon: Wallet,
    children: [
      { id: 'payroll', label: 'Nómina', path: '/payroll', icon: Wallet },
      { id: 'payroll-employees', label: 'Empleados', path: '/payroll/employees', icon: Users },
      { id: 'payroll-salaries', label: 'Salarios', path: '/payroll/salaries', icon: BarChart3 },
    ],
  },
  {
    id: 'settings',
    label: 'Configuración',
    path: '/settings',
    icon: Settings,
  },
];

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/proveedores': 'Gestión de Proveedores',
  '/inventory': 'Inventario',
  '/inventory/products': 'Productos',
  '/inventory/movements': 'Movimientos',
  '/inventory/alerts': 'Alertas',
  '/inventory/reports': 'Reportes',
  '/recetas': 'Lista de Recetas',
  '/recetas/procesos': 'Control de Procesos',
  '/recetas/historial': 'Historial de Ejecuciones',
  '/reports': 'Panel de Supervisión',
  '/dispatch': 'Centro de Despacho',
  '/users': 'Usuarios',
  '/users/roles': 'Roles',
  '/users/permissions': 'Permisos',
  '/payroll': 'Nómina',
  '/payroll/employees': 'Empleados',
  '/payroll/salaries': 'Salarios',
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

/** Exact match — use for submenu siblings so only one child highlights at a time. */
export function isNavChildPathActive(pathname: string, path: string): boolean {
  return pathname === path;
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.path && isNavPathActive(pathname, item.path)) return true;
  return item.children?.some((child) => isNavChildPathActive(pathname, child.path)) ?? false;
}
