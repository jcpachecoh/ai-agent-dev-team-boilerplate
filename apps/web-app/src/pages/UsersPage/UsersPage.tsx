import { Navigate, Route, Routes } from 'react-router-dom';

import RolesListView from '@/features/roles/RolesListView/RolesListView';
import UsersListView from '@/features/usuarios/UsersListView/UsersListView';
import PermissionsListView from '@/pages/PermissionsPage/PermissionsListView';

export default function UsersPage(): React.JSX.Element {
  return (
    <Routes>
      <Route index element={<UsersListView />} />
      <Route path="roles" element={<RolesListView />} />
      <Route path="permissions" element={<PermissionsListView />} />
      <Route path="*" element={<Navigate to="/users" replace />} />
    </Routes>
  );
}
