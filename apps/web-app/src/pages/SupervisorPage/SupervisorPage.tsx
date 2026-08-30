import { Navigate, Route, Routes } from 'react-router-dom';

import SupervisorPlantMapView from '@/features/supervisor/SupervisorPlantMapView/SupervisorPlantMapView';
import SupervisorStationsListView from '@/features/supervisor/SupervisorStationsListView/SupervisorStationsListView';

import styles from './SupervisorPage.module.scss';

export default function SupervisorPage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <Routes>
        <Route index element={<Navigate to="mapa" replace />} />
        <Route path="mapa" element={<SupervisorPlantMapView />} />
        <Route path="estaciones" element={<SupervisorStationsListView />} />
      </Routes>
    </div>
  );
}
