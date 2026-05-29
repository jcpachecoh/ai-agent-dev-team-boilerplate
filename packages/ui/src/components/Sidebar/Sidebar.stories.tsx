import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import {
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

import { darkBackground, lightBackground } from '../../storybook/theme-helpers';
import Sidebar from '.';
import type { SidebarNavItem } from './sidebar-types';

const demoUser = {
  name: 'Carlos Mendez',
  role: 'Supervisor',
  initials: 'CM',
};

const demoItems: SidebarNavItem[] = [
  {
    id: 'proveedores',
    label: 'Gestión de Proveedores',
    href: '/proveedores',
    icon: <Package size={18} aria-hidden />,
  },
  {
    id: 'inventario',
    label: 'Inventario',
    badge: 5,
    active: true,
    icon: <Warehouse size={18} aria-hidden />,
    children: [
      {
        id: 'inv-dashboard',
        label: 'Dashboard',
        href: '/inventory',
        icon: <LayoutGrid size={14} aria-hidden />,
      },
      {
        id: 'inv-products',
        label: 'Productos',
        href: '/inventory/products',
        icon: <Box size={14} aria-hidden />,
      },
      {
        id: 'inv-alerts',
        label: 'Alertas',
        href: '/inventory/alerts',
        icon: <TriangleAlert size={14} aria-hidden />,
        active: true,
      },
      {
        id: 'inv-reports',
        label: 'Reportes',
        href: '/inventory/reports',
        icon: <FileText size={14} aria-hidden />,
      },
    ],
  },
  {
    id: 'recetas',
    label: 'Recetas',
    icon: <ChefHat size={18} aria-hidden />,
    children: [
      {
        id: 'rec-list',
        label: 'Lista de Recetas',
        href: '/recetas',
        icon: <List size={14} aria-hidden />,
      },
      {
        id: 'rec-process',
        label: 'Control de Procesos',
        href: '/recetas/procesos',
        icon: <Monitor size={14} aria-hidden />,
      },
      {
        id: 'rec-history',
        label: 'Historial de Ejecuciones',
        href: '/recetas/historial',
        icon: <History size={14} aria-hidden />,
      },
    ],
  },
  {
    id: 'supervision',
    label: 'Panel de Supervisión',
    href: '/reports',
    badge: 4,
    icon: <Monitor size={18} aria-hidden />,
  },
  {
    id: 'despacho',
    label: 'Centro de Despacho',
    href: '/dispatch',
    icon: <Truck size={18} aria-hidden />,
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: <Users size={18} aria-hidden />,
    children: [
      {
        id: 'users-list',
        label: 'Usuarios',
        href: '/users',
        icon: <Users size={14} aria-hidden />,
      },
      {
        id: 'users-roles',
        label: 'Roles',
        href: '/users/roles',
        icon: <Shield size={14} aria-hidden />,
      },
      {
        id: 'users-perms',
        label: 'Permisos',
        href: '/users/permissions',
        icon: <Key size={14} aria-hidden />,
      },
    ],
  },
  {
    id: 'nomina',
    label: 'Nómina',
    icon: <Wallet size={18} aria-hidden />,
    children: [
      {
        id: 'payroll',
        label: 'Nómina',
        href: '/payroll',
        icon: <Wallet size={14} aria-hidden />,
      },
      {
        id: 'payroll-employees',
        label: 'Empleados',
        href: '/payroll/employees',
        icon: <Users size={14} aria-hidden />,
      },
      {
        id: 'payroll-salaries',
        label: 'Salarios',
        href: '/payroll/salaries',
        icon: <BarChart3 size={14} aria-hidden />,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Configuración',
    href: '/settings',
    icon: <Settings size={18} aria-hidden />,
  },
];

const meta: Meta<typeof Sidebar> = {
  title: 'Organismos/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  args: {
    theme: 'dark',
    collapsed: false,
    open: true,
    brandSubtitle: 'RESTOPSIQ',
    brandTitle: 'Plant MES',
    items: demoItems,
    user: demoUser,
    activePath: '/inventory/alerts',
  },
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    collapsed: { control: 'boolean' },
    open: { control: 'boolean' },
    overlay: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '780px', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Playground: Story = {};

export const DarkNormal: Story = {
  args: {
    theme: 'dark',
    collapsed: false,
  },
  ...darkBackground,
};

export const DarkCollapsed: Story = {
  args: {
    theme: 'dark',
    collapsed: true,
  },
  ...darkBackground,
};

export const LightNormal: Story = {
  args: {
    theme: 'light',
    collapsed: false,
  },
  ...lightBackground,
};

export const LightCollapsed: Story = {
  args: {
    theme: 'light',
    collapsed: true,
  },
  ...lightBackground,
};

export const ThemeAndCollapseMatrix: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <Sidebar {...args} theme="dark" collapsed={false} />
      <Sidebar {...args} theme="dark" collapsed />
      <Sidebar {...args} theme="light" collapsed={false} />
      <Sidebar {...args} theme="light" collapsed />
    </div>
  ),
  ...darkBackground,
};

export const InteractiveCollapse: Story = {
  render: (args) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <Sidebar
        {...args}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />
    );
  },
  ...darkBackground,
};

export const WithoutUser: Story = {
  args: {
    user: undefined,
  },
  ...darkBackground,
};
