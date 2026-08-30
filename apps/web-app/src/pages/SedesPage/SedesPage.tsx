import { Navigate, Route, Routes } from 'react-router-dom';

import SedeFormView from '@/features/sedes/SedeFormView/SedeFormView';
import SedesListView from '@/features/sedes/SedesListView/SedesListView';

export default function SedesPage(): React.JSX.Element {
  return (
    <Routes>
      <Route index element={<SedesListView />} />
      <Route path="nueva" element={<SedeFormView mode="create" />} />
      <Route path=":id/editar" element={<SedeFormView mode="edit" />} />
      <Route path="*" element={<Navigate to="/empresa/sedes" replace />} />
    </Routes>
  );
}
