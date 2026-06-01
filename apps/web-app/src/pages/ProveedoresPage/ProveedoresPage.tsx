import { Route, Routes } from 'react-router-dom';

import ProveedorDetailView from '@/features/proveedores/ProveedorDetailView';
import ProveedorFormView from '@/features/proveedores/ProveedorFormView';
import ProveedoresListView from '@/features/proveedores/ProveedoresListView';

import styles from './ProveedoresPage.module.scss';

export default function ProveedoresPage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <Routes>
        <Route index element={<ProveedoresListView />} />
        <Route path="nuevo" element={<ProveedorFormView mode="create" />} />
        <Route path=":supplierId" element={<ProveedorDetailView />} />
        <Route path=":supplierId/editar" element={<ProveedorFormView mode="edit" />} />
      </Routes>
    </div>
  );
}
