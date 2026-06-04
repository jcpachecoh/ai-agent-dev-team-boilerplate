import { Route, Routes } from 'react-router-dom';

import AppLayout from '@/layouts/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import DispatchPage from '@/pages/DispatchPage';
import InventoryAlertsPage from '@/pages/InventoryAlertsPage';
import InventoryCategoriesPage from '@/pages/InventoryCategoriesPage';
import InventoryDashboardPage from '@/pages/InventoryDashboardPage';
import InventoryMovementsPage from '@/pages/InventoryMovementsPage';
import InventoryProductDetailPage from '@/pages/InventoryProductDetailPage';
import InventoryProductsPage from '@/pages/InventoryProductsPage';
import InventoryReportsPage from '@/pages/InventoryReportsPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import NotFoundPage from '@/pages/NotFoundPage';
import PayrollPage from '@/pages/PayrollPage';
import ProveedoresPage from '@/pages/ProveedoresPage';
import RecipesPage from '@/pages/RecipesPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import UsersPage from '@/pages/UsersPage';
import { RequireAuth } from '@/routes/RequireAuth';

export default function App(): React.JSX.Element {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected — all routes require authentication */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/proveedores/*" element={<ProveedoresPage />} />
          <Route path="/inventory" element={<InventoryDashboardPage />} />
          <Route path="/inventory/products" element={<InventoryProductsPage />} />
          <Route path="/inventory/categories" element={<InventoryCategoriesPage />} />
          <Route path="/inventory/products/:id" element={<InventoryProductDetailPage />} />
          <Route path="/inventory/movements" element={<InventoryMovementsPage />} />
          <Route path="/inventory/alerts" element={<InventoryAlertsPage />} />
          <Route path="/inventory/reports" element={<InventoryReportsPage />} />
          <Route path="/recetas/*" element={<RecipesPage />} />
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
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
