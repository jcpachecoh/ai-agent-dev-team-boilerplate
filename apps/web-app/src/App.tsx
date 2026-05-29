import { Route, Routes } from 'react-router-dom';

import AppLayout from '@/layouts/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import DispatchPage from '@/pages/DispatchPage';
import InventoryPage from '@/pages/InventoryPage';
import NotFoundPage from '@/pages/NotFoundPage';
import PayrollPage from '@/pages/PayrollPage';
import ProveedoresPage from '@/pages/ProveedoresPage';
import RecipesPage from '@/pages/RecipesPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import UsersPage from '@/pages/UsersPage';

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/proveedores" element={<ProveedoresPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/products" element={<InventoryPage />} />
        <Route path="/inventory/movements" element={<InventoryPage />} />
        <Route path="/inventory/alerts" element={<InventoryPage />} />
        <Route path="/inventory/reports" element={<InventoryPage />} />
        <Route path="/recetas" element={<RecipesPage />} />
        <Route path="/recetas/procesos" element={<RecipesPage />} />
        <Route path="/recetas/historial" element={<RecipesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/dispatch" element={<DispatchPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/roles" element={<UsersPage />} />
        <Route path="/users/permissions" element={<UsersPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/payroll/employees" element={<PayrollPage />} />
        <Route path="/payroll/salaries" element={<PayrollPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
