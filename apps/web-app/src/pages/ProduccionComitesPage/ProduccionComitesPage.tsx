import { Navigate, Route, Routes } from 'react-router-dom';

import ProductionCommitteeDetailView from '@/features/produccion/ProductionCommitteeDetailView/ProductionCommitteeDetailView';
import ProductionCommitteesListView from '@/features/produccion/ProductionCommitteesListView/ProductionCommitteesListView';

import styles from '../ProduccionPage/ProduccionPage.module.scss';

export default function ProduccionComitesPage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <Routes>
        <Route index element={<ProductionCommitteesListView />} />
        <Route path=":committeeId" element={<ProductionCommitteeDetailView />} />
        <Route
          path="nuevo"
          element={<Navigate to="/produccion/comites" replace state={{ openCreate: true }} />}
        />
      </Routes>
    </div>
  );
}
