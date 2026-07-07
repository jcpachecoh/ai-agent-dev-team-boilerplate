import { Navigate, Route, Routes } from 'react-router-dom';

import ProductionOrderDetailView from '@/features/produccion/ProductionOrderDetailView/ProductionOrderDetailView';
import ProductionOrdersListView from '@/features/produccion/ProductionOrdersListView/ProductionOrdersListView';

import styles from './ProduccionPage.module.scss';

export default function ProduccionPage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <Routes>
        <Route index element={<ProductionOrdersListView />} />
        <Route path=":orderId" element={<ProductionOrderDetailView />} />
        <Route
          path="nueva"
          element={<Navigate to="/produccion/ordenes" replace state={{ openCreate: true }} />}
        />
      </Routes>
    </div>
  );
}
