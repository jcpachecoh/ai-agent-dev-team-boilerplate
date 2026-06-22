import { Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppModule } from '@/config/rbac.config';
import { LocationSessionGate } from '@/features/auth/components/LocationSessionGate';
import { LocationSessionProvider } from '@/features/auth/context/LocationSessionContext';
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
import NotFoundPage from '@/pages/NotFoundPage';
import PayrollPage from '@/pages/PayrollPage';
import ProduccionComitesPage from '@/pages/ProduccionComitesPage/ProduccionComitesPage';
import ProduccionPage from '@/pages/ProduccionPage';
import ProveedoresPage from '@/pages/ProveedoresPage';
import RecipesPage from '@/pages/RecipesPage';
import ReportsPage from '@/pages/ReportsPage';
import ResponsiveTableDemoPage from '@/pages/ResponsiveTableDemoPage';
import SettingsPage from '@/pages/SettingsPage';
import EmpresaInformacionPage from '@/pages/EmpresaInformacionPage/EmpresaInformacionPage';
import SedesPage from '@/pages/SedesPage';
import SignupPage from '@/pages/SignupPage';
import SupervisorPage from '@/pages/SupervisorPage/SupervisorPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import UsersPage from '@/pages/UsersPage';
import { RequireAuth } from '@/routes/RequireAuth';

export default function App(): React.JSX.Element {
  return (
    <LocationSessionProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected — all routes require authentication */}
        <Route element={<RequireAuth />}>
          <Route
            element={
              <LocationSessionGate>
                <AppLayout />
              </LocationSessionGate>
            }
          >
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute module={AppModule.DASHBOARD}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proveedores/*"
              element={
                <ProtectedRoute module={AppModule.PROVEEDORES}>
                  <ProveedoresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute module={AppModule.INVENTARIOS}>
                  <InventoryDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/products"
              element={
                <ProtectedRoute module={AppModule.INVENTARIOS}>
                  <InventoryProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/categories"
              element={
                <ProtectedRoute module={AppModule.INVENTARIOS}>
                  <InventoryCategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/products/:id"
              element={
                <ProtectedRoute module={AppModule.INVENTARIOS}>
                  <InventoryProductDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/movements"
              element={
                <ProtectedRoute module={AppModule.INVENTARIOS}>
                  <InventoryMovementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/alerts"
              element={
                <ProtectedRoute module={AppModule.INVENTARIOS}>
                  <InventoryAlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/reports"
              element={
                <ProtectedRoute module={AppModule.INVENTARIOS}>
                  <InventoryReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recetas"
              element={
                <ProtectedRoute module={AppModule.RECETAS}>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recetas/categorias"
              element={
                <ProtectedRoute module={AppModule.RECETAS}>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recetas/procesos"
              element={
                <ProtectedRoute module={AppModule.RECETAS}>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recetas/historial"
              element={
                <ProtectedRoute module={AppModule.RECETAS}>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/produccion/ordenes/*"
              element={
                <ProtectedRoute module={AppModule.PRODUCCION}>
                  <ProduccionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/produccion/comites/*"
              element={
                <ProtectedRoute module={AppModule.PRODUCCION}>
                  <ProduccionComitesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supervisor/*"
              element={
                <ProtectedRoute module={AppModule.SUPERVISOR}>
                  <SupervisorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute module={AppModule.SUPERVISOR}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dispatch"
              element={
                <ProtectedRoute module={AppModule.DESPACHO}>
                  <DispatchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/*"
              element={
                <ProtectedRoute module={AppModule.USUARIOS}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/*"
              element={
                <ProtectedRoute module={AppModule.NOMINA}>
                  <PayrollPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresa/informacion"
              element={
                <ProtectedRoute module={AppModule.EMPRESA}>
                  <EmpresaInformacionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresa/sedes/*"
              element={
                <ProtectedRoute module={AppModule.EMPRESA}>
                  <SedesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute module={AppModule.CONFIGURACION}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dev/responsive-table"
              element={
                <ProtectedRoute module={AppModule.CONFIGURACION}>
                  <ResponsiveTableDemoPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </LocationSessionProvider>
  );
}
